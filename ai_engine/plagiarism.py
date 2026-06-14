import json
import asyncio
from sklearn.metrics.pairwise import cosine_similarity
from pydantic import BaseModel, Field
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from ai_engine.graph import builder
from app.database import SessionLocal
import app.models as models

embeddings_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
evaluator_llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite", temperature=0.0)


class PlagiarismDecision(BaseModel):
    is_suspicious: bool = Field(
        description="True if cheating/collusion. False if standard proof, MCQ, or expected math."
    )
    reason: str = Field(description="Very short reason why.")


evaluator = evaluator_llm.with_structured_output(PlagiarismDecision)


async def check_suspicious_pair(
    question_text: str, ans_a: str, ans_b: str, sem: asyncio.Semaphore
) -> bool:
    """Uses an LLM to distinguish between actual plagiarism and standard mathematical proofs/MCQs."""

    # Fast-fail for tiny answers (like "A" or "42")
    if len(ans_a) < 30 and len(ans_b) < 30:
        return False

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are an academic integrity AI. Two students have highly similar answers. 
                Determine if this similarity is SUSPICIOUS or EXPECTED.
                
                EXPECTED (Return False):
                - Single-option/MCQ answers.
                - Standard mathematical proofs or derivations where only one logical path exists.
                - Simple arithmetic where steps are universally identical.
                
                SUSPICIOUS (Return True):
                - Matching idiosyncratic phrasing or highly unique explanations.
                - Matching identical, highly specific mathematical mistakes.
                - Copied text that goes beyond standard formulas.
                """,
            ),
            ("user", "Question: {q}\n\nStudent 1: {a}\n\nStudent 2: {b}"),
        ]
    )

    chain = prompt | evaluator

    async with sem:
        try:
            decision = await chain.ainvoke({"q": question_text, "a": ans_a, "b": ans_b})
            return decision.is_suspicious
        except Exception as e:
            print(f"LLM Eval failed: {e}")
            return False


async def run_batch_plagiarism_check(exam_id: int):
    print(f"--- Starting Plagiarism Check for Exam {exam_id} ---")
    db = SessionLocal()

    pending_subs = (
        db.query(models.Submission)
        .filter(
            models.Submission.exam_id == exam_id,
            models.Submission.status == "pending_review",
        )
        .all()
    )

    db.close()

    if len(pending_subs) < 2:
        return {"status": "skipped", "message": "Not enough submissions to compare."}

    q_data = {}

    async with AsyncSqliteSaver.from_conn_string("checkpoints.db") as memory:
        graph = builder.compile(checkpointer=memory)

        for sub in pending_subs:
            config = {"configurable": {"thread_id": f"submission_{sub.id}"}}
            state = await graph.aget_state(config)

            if state.tasks and state.tasks[0].interrupts:
                questions = state.tasks[0].interrupts[0].value.get("questions", [])
                for q in questions:
                    q_ref = q["questionRef"]
                    if q_ref not in q_data:
                        q_data[q_ref] = []

                    q_data[q_ref].append(
                        {
                            "sub_id": sub.id,
                            "student_id": q["studentId"],
                            "ocr_text": q["ocrText"],
                            "q_text": q["questionText"],
                        }
                    )

    final_flags = {}  # Format: { sub_id: { q_ref: { count: 1, papers: ["S101"] } } }
    sem = asyncio.Semaphore(5)

    for q_ref, students in q_data.items():
        # Filtering out empty answers before comparing
        valid_students = [s for s in students if len(s["ocr_text"].strip()) > 5]
        if len(valid_students) < 2:
            continue

        texts = [s["ocr_text"] for s in valid_students]
        try:
            vectors = embeddings_model.embed_documents(texts)
        except Exception as e:
            print(f"Embedding API failed for question {q_ref}: {e}")
            continue
        sim_matrix = cosine_similarity(vectors)

        llm_tasks = []
        pair_indices = []

        for i in range(len(valid_students)):
            for j in range(i + 1, len(valid_students)):
                if sim_matrix[i][j] > 0.85:
                    pair_indices.append((i, j))
                    llm_tasks.append(
                        check_suspicious_pair(
                            valid_students[i]["q_text"], texts[i], texts[j], sem
                        )
                    )

        if not llm_tasks:
            continue

        results = await asyncio.gather(*llm_tasks)

        for (i, j), is_suspicious in zip(pair_indices, results):
            if is_suspicious:
                s1, s2 = valid_students[i], valid_students[j]

                if str(s1["sub_id"]) not in final_flags:
                    final_flags[str(s1["sub_id"])] = {}
                if str(s2["sub_id"]) not in final_flags:
                    final_flags[str(s2["sub_id"])] = {}
                if q_ref not in final_flags[str(s1["sub_id"])]:
                    final_flags[str(s1["sub_id"])][q_ref] = {"count": 0, "papers": []}
                if q_ref not in final_flags[str(s2["sub_id"])]:
                    final_flags[str(s2["sub_id"])][q_ref] = {"count": 0, "papers": []}

                final_flags[str(s1["sub_id"])][q_ref]["count"] += 1
                final_flags[str(s1["sub_id"])][q_ref]["papers"].append(s2["student_id"])

                final_flags[str(s2["sub_id"])][q_ref]["count"] += 1
                final_flags[str(s2["sub_id"])][q_ref]["papers"].append(s1["student_id"])

    flag_file = f"uploads/exams/exam_{exam_id}/plagiarism.json"
    with open(flag_file, "w") as f:
        json.dump(final_flags, f)

    print(f"--- Plagiarism Check Complete! Saved to {flag_file} ---")
    return {
        "status": "success",
        "flags_found": sum(len(qs) for qs in final_flags.values()),
    }

import os
import base64
import json
import time
from typing import Any, TypedDict
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from langgraph.types import interrupt, Command
from langgraph.checkpoint.memory import MemorySaver
from langchain_google_genai import ChatGoogleGenerativeAI


from dotenv import load_dotenv

load_dotenv()
from pydantic import BaseModel, Field


# PYDANTIC MODELS
class RubricCriterionMatch(BaseModel):
    name: str = Field(description="Name of the rubric criterion")
    awarded: int = Field(description="Points awarded by the AI")
    max: int = Field(description="Maximum points possible for this specific criterion")
    status: str = Field(description="Must be strictly 'full', 'partial', or 'none'")


class QuestionGradingResult(BaseModel):
    questionRef: str = Field(
        description="The ID of the question currently being evaluated"
    )
    aiScore: int = Field(description="Points alloted by AI for this question")
    aiJustification: str = Field(
        description="Detailed text breakdown explaining why points were awarded or cut"
    )
    rubricMatch: list[RubricCriterionMatch] = Field(
        description="Array breaking down points per criterion"
    )
    confidence: int = Field(
        description="AI confidence score from 0 to 100 for this evaluation"
    )


class FullExamGradingResult(BaseModel):
    questions: list[QuestionGradingResult] = Field(
        description="Array containing the grading result for every single question answered in the exam paper"
    )


# STATE SCHEMA
class GradingState(TypedDict):
    submission_id: int
    page_img_paths: list[str]
    rubric: dict[str, Any]
    ocr_text: str
    detailed_analysis: dict
    status: str
    feedback: str


# NODES
def run_nemotron_ocr_node(state: GradingState):
    print("--- [NODE 1] EXECUTING MULTIMODAL OCR VIA NEMOTRON ---")

    nemotron_vlm = ChatOpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        model="nvidia/nemotron-nano-12b-v2-vl:free",
        base_url="https://openrouter.ai/api/v1",
        max_completion_tokens=2000,
    )

    full_transcription = ""

    for index, img_path in enumerate(state["page_img_paths"]):
        print(f"Reading page number {index+1} from {img_path}...")

        try:
            with open(img_path, "rb") as img_file:
                img_bytes = img_file.read()
                b64_img = base64.b64encode(img_bytes).decode("utf-8")
                img_file.close()

            message = HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": "You are an expert academic digitizer. Your task is to convert this handwritten exam page into clean, structured Markdown. Follow these strict rules: "
                        "1. INTELLIGENT CORRECTION: Fix obvious spelling errors caused by messy cursive (e.g., 'quicksoft' to 'quicksort', 'heavyly' to 'heavily'). However, DO NOT alter the student's underlying logic, grammar, or factual claims. "
                        "2. MATHEMATICS & SCIENCE: You MUST use standard LaTeX for all math, physics, chemistry, and algorithmic notation. Use single `$` for inline variables (e.g., $O(n^2)$) and double `$$` for block equations. "
                        "3. STRUCTURE: Preserve explicit question labels (e.g., 'Q1)', '2a.') clearly on new lines to maintain the document hierarchy. "
                        "4. NOISE FILTERING: Completely ignore scribbles, explicitly crossed-out text, smudges, and page numbers. "
                        "5. BOUNDARIES: Do not attempt to solve, grade, or evaluate the text. Output ONLY the corrected transcription."
                        "If you output any conversational words, THE SYSTEM AND DATABASE WILL ALL CRASH!!",
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{b64_img}"},
                    },
                ]
            )

            response = nemotron_vlm.invoke([message])
            full_transcription += f"\n\n--- Page {index+1} ---\n\n" + response.content
        except Exception as e:
            print(f"Error reading and processing {img_path}: {e}")
            return {"status": "error_ocr_processing"}
    print(f"OCR text transcribed: {full_transcription}")
    return {"ocr_text": full_transcription, "status": "ocr_completed"}


def grade_with_gemini_model(state: GradingState):
    print("--- [NODE 2] GRADING ANSWER SCRIPT USING GEMINI ---")

    gemini_model = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0.0)

    structured_gemini = gemini_model.with_structured_output(FullExamGradingResult)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an elite, objective university grading assistant. Evaluate the provided student exam transcription strictly against the provided rubric configuration. Identify which question is being answered, calculate points cleanly, and output structured JSON matching the requested schema exactly.",
            ),
            (
                "human",
                "RUBRIC CONFIGURATION:\n{rubric}\n\nSTUDENT EXAM TRANSCRIPTION:\n{ocr_text}",
            ),
        ]
    )

    grading_chain = prompt | structured_gemini

    try:
        result = grading_chain.invoke(
            {"rubric": json.dumps(state["rubric"]), "ocr_text": state["ocr_text"]}
        )
        return {"detailed_analysis": result.model_dump(), "status": "pipeline_complete"}
    except Exception as e:
        print(f"Error during Gemini Grading: {e}")
        return {"status": "error_grading"}


# def human_intervention_decider(state: GradingState):
#     print("waiting for user input")
#     decision = interrupt(
#         {"Would you like to continue the transcription to the LLM? (yes/no)"}
#     )
#     approval = decision.get("approval", "").lower().strip()
#     if approval == "yes":
#         return Command(goto="gemini_grader")
#     else:
#         return Command(goto=END)


builder = StateGraph(GradingState)

builder.add_node("nemotron_ocr", run_nemotron_ocr_node)
builder.add_node("gemini_grader", grade_with_gemini_model)
# builder.add_node("human_intervention", human_intervention_decider)

builder.set_entry_point("nemotron_ocr")
builder.add_edge("nemotron_ocr", "gemini_grader")
# builder.add_edge("nemotron_ocr", "human_intervention")
builder.add_edge("gemini_grader", END)

memory = MemorySaver()

graph = builder.compile(checkpointer=memory)
config = {"configurable": {"thread_id": "thread"}}

# Local testing

if __name__ == "__main__":

    initial_state = {
        "submission_id": 1,
        "page_img_paths": [
            "uploads/exams/exam_1/images/Adobe_Scan_11_Jun_2026/page-1.png"
        ],
        "rubric": {
            "exam": "CS301 Midterm",
            "questions": [
                {
                    "id": "Q1",
                    "text": "Explain time complexity of quicksort.",
                    "points": 10,
                    "keywords": ["O(n log n)", "average case", "pivot"],
                    "partial_credit": True,
                }
            ],
        },
        "ocr_text": "",
        "detailed_analysis": {},
        "status": "started",
    }
    print("Initializing GradeOps AI Pipeline...")
    start_time = time.perf_counter()
    final_state = graph.invoke(initial_state, config=config)
    end_time = time.perf_counter()

    print("\n\n=== FINAL GRADED OUTPUT ===")
    print(json.dumps(final_state.get("detailed_analysis", {}), indent=2))
    print(f"Time taken to execute: {end_time-start_time:.6f} seconds")

# GradeOps
 
> AI-powered Human-in-the-Loop exam grading platform for handwritten scripts.
 
GradeOps eliminates the bottleneck of manual exam grading by pairing Vision-Language Models with an agentic LLM pipeline to read handwritten answers, score them against structured rubrics, and route every decision through a human review step before any grade is finalized.
 
## What it does
 
- Instructors upload bulk PDF exam scans and define granular JSON rubrics
- A Vision-Language Model extracts handwritten answers with LaTeX-aware OCR
- Google Gemini scores each answer against the rubric, awarding partial credit with per-criterion justifications
- A LangGraph state machine pauses the pipeline and queues results for Teaching Assistant review
- TAs approve, override, or flag decisions through a keyboard-driven review dashboard
- A cosine similarity + LLM filter automatically detects and flags suspiciously similar answers across submissions
## Repository structure
 
```
gradeops/
├── backend/     FastAPI grading engine — LangGraph pipeline, OCR, Gemini grader, plagiarism check
├── frontend/    React dashboard — Instructor portal, TA review queue, keyboard shortcuts
└── README.md
```
 
## Tech stack
 
| Layer | Technology |
|---|---|
| Backend | FastAPI, Python |
| AI pipeline | LangGraph, LangChain |
| OCR | Gemini Vision (gemini-flash) |
| Grading | Google Gemini |
| Plagiarism | Gemini Embeddings + cosine similarity |
| Database | PostgreSQL (app data), SQLite (LangGraph checkpoints) |
| Frontend | React 19, Vite, Framer Motion, Three.js |
| Auth | JWT, httponly cookies |
 
## Original repositories
 
- Backend: [gradeops-backend](https://github.com/exharmonic/gradeops-backend)
- Frontend: [gradeops-frontend](https://github.com/exharmonic/gradeops-frontend)

## Getting started

```bash
git clone https://github.com/exharmonic/gradeops
```

Then follow the setup guide for each service:
- [Backend setup](backend/README.md) — FastAPI server, database, and API keys
- [Frontend setup](frontend/README.md) — React dev server and Axios configuration
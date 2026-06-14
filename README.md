# GradeOps Backend: AI-Powered Grading Engine

**GradeOps Backend** is the core AI engine for the GradeOps grading system, utilizing Vision-Language Models (VLMs) and LangGraph agentic workflows to evaluate handwritten exams and orchestrate Human-in-the-Loop (HITL) reviews.

*Note: This repository contains the FastAPI API and AI orchestration logic. For the React-based Instructor and TA dashboards, please visit the [GradeOps Frontend Repository](https://github.com/exharmonic/gradeops-frontend).*

## Core Architecture
* **Dual-Engine AI Pipeline:** Leverages **NVIDIA Nemotron (VLM)** for high-fidelity OCR of handwritten text and mathematical equations, seamlessly pipelined into **Google Gemini** for intelligent, dynamic scoring against complex, nested JSON rubrics.
* **Secure Authentication & Authorization:** Implements robust Role-Based Access Control (RBAC) to enforce strict privilege boundaries between Instructors and Teaching Assistants, utilizing secure HTTP-only cookies to manage authentication state and protect against Cross-Site Scripting (XSS) vulnerabilities.
* **Stateful Agentic Orchestration:** Utilizes LangGraph to map the entire grading lifecycle into a persistent state machine, systematically pausing the AI pipeline when human intervention is required and safely persisting the queue via `SqliteSaver`.
* **Human-in-the-Loop (HITL) Synchronization:** Exposes secure REST endpoints that bridge the AI backend with the frontend, empowering Teaching Assistants to intuitively review, adjust, and finalize AI-generated scores without interrupting the automated pipeline.
* **Asynchronous Background Processing:** Employs FastAPI background tasks to offload heavy VLM and OCR compute operations, ensuring the server remains highly responsive and dashboard metrics update dynamically.
* **Optimized Relational Data Layer:** Powered by SQLAlchemy and PostgreSQL/SQLite, engineered with advanced query optimizations to instantly aggregate batch grading statistics for large-scale exam queues.

## Tech Stack
* **Framework:** FastAPI, Python
* **AI / Orchestration:** LangGraph
* **Models:** 
    * Google Gemini (`gemini-3.1-flash-lite` for dynamic rubric reasoning)
    * NVIDIA Nemotron (`nvidia/nemotron-nano-12b-v2-vl:free` via OpenRouter for complex OCR)
* **Database:** PostgreSQL, SQLite (for state checkpoints)
* **ORM:** SQLAlchemy

---

## Local Setup Guide

### 1. Clone the Repo
Open your terminal and clone the repo to your local machine:
```bash
git clone https://github.com/exharmonic/grade-ops
cd grade-ops
```

### 2. Setup a virtual environment
In your terminal, execute:
#### Windows:
```bash 
python -m venv .venv
.venv\Scripts\activate
```
#### Git bash:
```bash
source .venv/Scripts/activate
```
#### macOS/Linux:
```bash
source .venv/bin/activate
```

### 3. Install dependencies
**Within the virtual environment**, execute:
```bash
pip install -r requirements.txt
```

### 4. Setup Environment Variables (.env)
For security, passwords and secrets are not uploaded to GitHub, they must instead be stored in a `.env` file.

Copy the `.env.example` file and name the new file `.env`
Now, update the `.env` file with your local PostgresSQL `user`, `password` and a preferred secret_key, and your AI model API keys.
#### Generating a random secret key
In your terminal, run:
```bash
openssl rand -hex 32
```
Copy the output and use that as the secret_key

### 5. Setup the Database
Ensure that your local PostgresSQL server is running.
#### SQL shell (psql)
```sql
CREATE DATABASE gradeops_db;
```
Or you can simply, open your `pgAdmin`, and create a database `gradeops_db` manually

### 6. Run the FastAPI server
In your terminal, run:
```bash
uvicorn app.main:app --reload
```
The server will start on http://127.0.0.1:8000

### 7. Verify endpoints
Once the server is running, you can explore, test, and interact with all backend endpoints via the automatically generated Swagger UI:

* **Interactive API Documentation:** http://127.0.0.1:8000/docs

> **⚠️ Note on Testing File Uploads (`POST /upload/`):** The built-in Swagger UI has a known limitation with testing endpoints that accept multiple file uploads simultaneously (like batch exam uploads). For testing the file ingestion endpoints, it is highly recommended to use **Postman**, **cURL**, or the connected React frontend rather than the Swagger UI.
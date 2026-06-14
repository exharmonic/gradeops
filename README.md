# GradeOps Frontend: Secure RBAC Portals for Instructors & TAs

**GradeOps Frontend** is the user-interface for the GradeOps AI grading engine. Built with React, it empowers Instructors to manage complex exam rubrics and enables Teaching Assistants (TAs) to seamlessly interface with AI-generated evaluations through a Human-in-the-Loop (HITL) review system.

*Note: This repository contains the React UI and client-side logic. For the FastAPI AI orchestration engine, please visit the [GradeOps Backend Repository](https://github.com/exharmonic/grade-ops).*

## Core Features



## Tech Stack



---

### 1. Clone the Repo
Open your terminal and clone the repo to your local machine:
```bash
git clone https://github.com/exharmonic/gradeops-frontend
cd gradeops-frontend
```

### 2. Install dependencies
Ensure that you have [node.js](https://nodejs.org/en) installed, then execute:
```bash
npm install
```
### 3. Run the development server
Start the Vite development server:
```bash
npm run dev
```
The server will start on http://127.0.0.1:5173

### 4. Backend server requirement
To fully test authentication, file uploads, and the grading pipeline locally, ensure that your **GradeOps Backend** is running simultaneously on http://127.0.0.1:8000.
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any

class UserCreate(BaseModel):
    email: EmailStr
    password: str

    role: str= Field(..., pattern="^(instructor|ta)")

class UserResponse(BaseModel):
    email: EmailStr
    id: int
    role:str

    model_config = ConfigDict(from_attributes=True)

class ExamCreate(BaseModel):
    title: str
    rubric: Dict[str, Any]

class ExamResponse(BaseModel):
    id: int
    title: str
    rubric: Dict[str, Any]
    instructor_id: int
    model_config = ConfigDict(from_attributes=True)

class SubmissionResponse(BaseModel):
    id: int
    student_roll_no: str
    pdf_path: str
    image_path: str
    ai_score: Optional[int] = None           # Optional because it starts empty
    ai_justification: Optional[str] = None   # Optional because it starts empty
    status: str
    exam_id: int

    model_config = ConfigDict(from_attributes = True)
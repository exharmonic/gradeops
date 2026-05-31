from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
import app.models as models
from app.database import get_db
from app.oauth2 import get_current_user
import app.schemas as schemas 

router = APIRouter(
    prefix="/exams",
    tags=["Exams"]
)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.ExamResponse)
async def add_exam(exam: schemas.ExamCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "instructor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only instructors can edit exams")
    
    duplicate_exam = db.query(models.Exam).filter(models.Exam.title == exam.title, models.Exam.instructor_id == current_user.id).first()
    if duplicate_exam is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail=f"You already have an exam titled '{exam.title}'."
        )

    new_exam = models.Exam(**exam.model_dump(), instructor_id= current_user.id)

    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    return new_exam

from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
import app.models as models
from app.auth import get_current_user
from typing import Annotated, List
from app.database import get_db
from sqlalchemy.orm import Session
import os, shutil, re, pymupdf

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[models.User, Depends(get_current_user)]

router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)

def secure_filename(filename: str) -> str:
    return re.sub(r'[^a-zA-Z0-9_.-]', '_', os.path.basename(filename))

@router.post("/")
def upload_files(
    current_user: user_dependency, 
    db: db_dependency,
    files: List[UploadFile] = File(...), 
    exam_id: int = Form(...)):
    
    if current_user.role != "instructor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be an Instructor to upload files")
    
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()

    if exam is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No such exam found.")
    
    exam_base_folder = f"uploads/exams/exam_{exam_id}"
    required_folders = [f"{exam_base_folder}/pdfs", f"{exam_base_folder}/images"]

    for path in required_folders:
        os.makedirs(path, exist_ok=True)

    saved_submissions = []
    created_pdf_paths = []
    created_img_dirs = []

    try:
        for file in files:
            safe_name = secure_filename(file.filename)
            student_id = safe_name.rsplit(".", 1)[0]

            pdf_destination = f"{required_folders[0]}/{safe_name}"
            imgs_destination = f"{required_folders[1]}/{student_id}"

            existing_submission = db.query(models.Submission).filter(
                models.Submission.exam_id == exam_id,
                models.Submission.student_roll_no == student_id
            ).first()

            if existing_submission is not None:
                if os.path.exists(existing_submission.images_path):
                    shutil.rmtree(existing_submission.images_path)
                existing_submission.ai_score = -1
                existing_submission.ai_justification = "None"
            else:
                new_submission = models.Submission(
                    student_roll_no = student_id,
                    pdf_path = pdf_destination,
                    images_path = imgs_destination,
                    ai_score = -1,
                    ai_justification = "None",
                    exam_id = exam_id
                )
                db.add(new_submission)


            with open(pdf_destination, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file.file.close()
            created_pdf_paths.append(pdf_destination)

            os.makedirs(imgs_destination, exist_ok=True)
            with pymupdf.open(pdf_destination) as doc:
                for page in doc:
                    pix = page.get_pixmap(dpi=150)
                    pix.save(f"{imgs_destination}/page-{page.number}.png")

            created_img_dirs.append(imgs_destination)
            saved_submissions.append(student_id)
        
        db.commit()

    except Exception as error:
        db.rollback()

        for file_path in created_pdf_paths:
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as f_error:
                    print(f"Failed to delete {file_path} : {f_error}")
            
        for img_dir in created_img_dirs:
            if os.path.exists(img_dir):
                try:
                    shutil.rmtree(img_dir)
                except Exception as img_error:
                    print(f"Failed to delete {img_dir} : {img_error}")
        
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error uploading files: {str(error)}")
    
    return {
        "message" : "Bulk upload successful!",
        "exam_id" : exam_id,
        "students_processed" : saved_submissions
    }
                
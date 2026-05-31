from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import app.models as models
from app.utils import verify_password
from app.oauth2 import create_access_token

router = APIRouter(
    prefix="/login",
    tags=["Login"]
)

@router.post("/")
async def login(
    user_credentials: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(user_credentials.username == models.User.email).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid Credentials!"
        )

    is_password_correct = verify_password(user_credentials.password, user.password)

    if not is_password_correct:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid Credentials!"
        )

    access_token = create_access_token({"id": user.id})

    return {
                "access_token": access_token,
                "token_type": "bearer",
                "role": user.role
            }

    
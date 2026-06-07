
from fastapi import APIRouter, Depends
from app.auth import get_current_user
import app.models as models


router = APIRouter(
    prefix="/users",
    tags=["User"]
)

@router.get("/me")
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "role": current_user.role
    }
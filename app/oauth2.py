import jwt
from app.database import get_db
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from jwt.exceptions import InvalidTokenError
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timezone, timedelta
import app.models as models
import os

ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")))

    to_encode.update({"exp" : expire})

    encoded_jwt = jwt.encode(to_encode, os.getenv("SECRET_KEY"), algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token:str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    
    credential_error = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    try:
        decoded_token = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[ALGORITHM])
        user_id = decoded_token.get("id")
        if not user_id:
            raise credential_error
    except InvalidTokenError as e:
        print(e)
        raise credential_error
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise credential_error

    return user
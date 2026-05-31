from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI

from routers import exams, auth, login, submissions
from app.database import engine
from app import models


models.Base.metadata.create_all(bind=engine)
app = FastAPI()
app.include_router(exams.router)
app.include_router(auth.router)
app.include_router(login.router)
app.include_router(submissions.router)

@app.get("/")
async def root():
    return {"Message" : "Welcome to my API!"}
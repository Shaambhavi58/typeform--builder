from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401
from app.database import Base, engine
from app.routers import forms, public, questions, responses


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Typeform Clone API",
    version="1.0.0",
    description="Backend API for the Typeform Builder assignment.",
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://typeform-builder-one.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(responses.router)
app.include_router(public.router)


@app.get("/", tags=["Health"])
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "message": "Typeform Clone API is running",
    }
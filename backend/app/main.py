from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
import app.models  # noqa: F401


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Typeform Clone API",
    version="1.0.0",
    description="Backend API for the Typeform Builder assignment.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://typeform-builder-one.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "message": "Typeform Clone API is running",
        "debug_version": "v3-canary-test",
    }
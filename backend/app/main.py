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


@app.get("/debug/source", tags=["Debug"])
def debug_source() -> dict[str, str]:
    import pathlib
    path = pathlib.Path(__file__).parent / "services" / "question_service.py"
    content = path.read_text()
    return {
        "path": str(path),
        "has_isinstance_fix": "isinstance(option_data, dict)" in content,
        "has_canary": "CANARY" in content,
        "line_153_area": "\n".join(content.splitlines()[145:160]),
    }
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.form import FormStatus
from app.schemas.question import QuestionCreate, QuestionRead


class FormBase(BaseModel):
    title: str = Field(
        default="Untitled form",
        min_length=1,
        max_length=255,
    )

    description: str | None = Field(
        default=None,
        max_length=3000,
    )

    thank_you_title: str = Field(
        default="Thank you!",
        min_length=1,
        max_length=255,
    )

    thank_you_description: str | None = Field(
        default="Your response has been submitted.",
        max_length=2000,
    )


class FormCreate(FormBase):
    questions: list[QuestionCreate] = Field(
        default_factory=list,
    )


class FormUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    description: str | None = Field(
        default=None,
        max_length=3000,
    )

    thank_you_title: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    thank_you_description: str | None = Field(
        default=None,
        max_length=2000,
    )


class FormStatusUpdate(BaseModel):
    status: Literal[
        "draft",
        "published",
    ]


class FormRead(FormBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    status: Literal[
        "draft",
        "published",
    ]
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionRead] = Field(
        default_factory=list,
    )


class FormListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    slug: str
    status: Literal[
        "draft",
        "published",
    ]
    response_count: int = 0
    question_count: int = 0
    created_at: datetime
    updated_at: datetime


class FormPublishResponse(BaseModel):
    id: int
    status: Literal["published"]
    slug: str
    public_url: str


class FormUnpublishResponse(BaseModel):
    id: int
    status: Literal["draft"]


class FormDuplicateResponse(BaseModel):
    id: int
    title: str
    slug: str
    status: Literal["draft"]
    message: str = "Form duplicated successfully."


class FormDeleteResponse(BaseModel):
    message: str = "Form deleted successfully."
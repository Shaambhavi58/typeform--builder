from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.schemas.form import FormRead


class AnswerCreate(BaseModel):
    question_id: int = Field(gt=0)
    value: str | int | float | bool | None = None


class ResponseSubmit(BaseModel):
    answers: list[AnswerCreate] = Field(
        min_length=1,
    )

    @model_validator(mode="after")
    def validate_unique_question_ids(
        self,
    ) -> "ResponseSubmit":
        question_ids = [
            answer.question_id
            for answer in self.answers
        ]

        if len(question_ids) != len(set(question_ids)):
            raise ValueError(
                "Each question can only be answered once."
            )

        return self


class AnswerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    response_id: int
    question_id: int
    value: str | None


class ResponseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    form_id: int
    submitted_at: datetime
    answers: list[AnswerRead] = Field(
        default_factory=list,
    )


class ResponseListItem(BaseModel):
    id: int
    submitted_at: datetime
    answer_count: int


class SubmissionSuccess(BaseModel):
    response_id: int
    message: str = "Response submitted successfully."
    submitted_at: datetime


class PublicFormRead(FormRead):
    pass


class ChoiceSummaryItem(BaseModel):
    option: str
    count: int
    percentage: float


class QuestionSummary(BaseModel):
    question_id: int
    question_title: str
    question_type: str
    total_answers: int
    skipped: int
    choices: list[ChoiceSummaryItem] | None = None
    average: float | None = None


class FormSummaryResponse(BaseModel):
    form_id: int
    total_responses: int
    questions: list[QuestionSummary]
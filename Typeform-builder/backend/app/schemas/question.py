from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.question import QuestionType


CHOICE_QUESTION_TYPES = {
    QuestionType.MULTIPLE_CHOICE.value,
    QuestionType.DROPDOWN.value,
}


class QuestionOptionBase(BaseModel):
    label: str = Field(
        min_length=1,
        max_length=255,
    )
    position: int = Field(ge=0)


class QuestionOptionCreate(QuestionOptionBase):
    pass


class QuestionOptionUpdate(BaseModel):
    label: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )
    position: int | None = Field(
        default=None,
        ge=0,
    )


class QuestionOptionRead(QuestionOptionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_id: int


class QuestionBase(BaseModel):
    type: Literal[
        "short_text",
        "long_text",
        "multiple_choice",
        "dropdown",
        "email",
        "number",
        "yes_no",
        "rating",
    ] = QuestionType.SHORT_TEXT.value

    title: str = Field(
        default="Untitled question",
        min_length=1,
        max_length=500,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    required: bool = False

    position: int = Field(
        default=0,
        ge=0,
    )


class QuestionCreate(QuestionBase):
    options: list[QuestionOptionCreate] = Field(
        default_factory=list,
    )

    @model_validator(mode="after")
    def validate_options(self) -> "QuestionCreate":
        if self.type in CHOICE_QUESTION_TYPES and len(self.options) < 2:
            raise ValueError(
                "Multiple-choice and dropdown questions require at least two options."
            )

        if self.type not in CHOICE_QUESTION_TYPES and self.options:
            raise ValueError(
                "Options are only allowed for multiple-choice and dropdown questions."
            )

        return self


class QuestionUpdate(BaseModel):
    type: Literal[
        "short_text",
        "long_text",
        "multiple_choice",
        "dropdown",
        "email",
        "number",
        "yes_no",
        "rating",
    ] | None = None

    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=500,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    required: bool | None = None

    position: int | None = Field(
        default=None,
        ge=0,
    )

    options: list[QuestionOptionCreate] | None = None

    @model_validator(mode="after")
    def validate_options(self) -> "QuestionUpdate":
        if self.type in CHOICE_QUESTION_TYPES:
            if self.options is not None and len(self.options) < 2:
                raise ValueError(
                    "Multiple-choice and dropdown questions require at least two options."
                )

        if (
            self.type is not None
            and self.type not in CHOICE_QUESTION_TYPES
            and self.options
        ):
            raise ValueError(
                "Options are only allowed for multiple-choice and dropdown questions."
            )

        return self


class QuestionRead(QuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    form_id: int
    options: list[QuestionOptionRead] = Field(
        default_factory=list,
    )


class QuestionReorderItem(BaseModel):
    question_id: int = Field(gt=0)
    position: int = Field(ge=0)


class QuestionReorderRequest(BaseModel):
    questions: list[QuestionReorderItem] = Field(
        min_length=1,
    )

    @model_validator(mode="after")
    def validate_unique_questions_and_positions(
        self,
    ) -> "QuestionReorderRequest":
        question_ids = [
            item.question_id
            for item in self.questions
        ]

        positions = [
            item.position
            for item in self.questions
        ]

        if len(question_ids) != len(set(question_ids)):
            raise ValueError("Question IDs must be unique.")

        if len(positions) != len(set(positions)):
            raise ValueError("Question positions must be unique.")

        return self
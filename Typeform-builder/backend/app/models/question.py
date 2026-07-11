from __future__ import annotations

from enum import Enum

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class QuestionType(str, Enum):
    SHORT_TEXT = "short_text"
    LONG_TEXT = "long_text"
    MULTIPLE_CHOICE = "multiple_choice"
    DROPDOWN = "dropdown"
    EMAIL = "email"
    NUMBER = "number"
    YES_NO = "yes_no"
    RATING = "rating"


class Question(Base):
    __tablename__ = "questions"
    __table_args__ = (
        UniqueConstraint(
            "form_id",
            "position",
            name="uq_question_form_position",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    form_id: Mapped[int] = mapped_column(
        ForeignKey("forms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=QuestionType.SHORT_TEXT.value,
    )

    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        default="Untitled question",
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    required: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    form: Mapped["Form"] = relationship(
        back_populates="questions",
    )

    options: Mapped[list["QuestionOption"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuestionOption.position",
        passive_deletes=True,
    )

    answers: Mapped[list["Answer"]] = relationship(
        back_populates="question",
    )


class QuestionOption(Base):
    __tablename__ = "question_options"
    __table_args__ = (
        UniqueConstraint(
            "question_id",
            "position",
            name="uq_option_question_position",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    label: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    question: Mapped["Question"] = relationship(
        back_populates="options",
    )
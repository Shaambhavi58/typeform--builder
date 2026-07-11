from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FormResponse(Base):
    __tablename__ = "form_responses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    form_id: Mapped[int] = mapped_column(
        ForeignKey("forms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    form: Mapped["Form"] = relationship(
        back_populates="responses",
    )

    answers: Mapped[list["Answer"]] = relationship(
        back_populates="response",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Answer(Base):
    __tablename__ = "answers"
    __table_args__ = (
        UniqueConstraint(
            "response_id",
            "question_id",
            name="uq_answer_response_question",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    response_id: Mapped[int] = mapped_column(
        ForeignKey("form_responses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    response: Mapped["FormResponse"] = relationship(
        back_populates="answers",
    )

    question: Mapped["Question"] = relationship(
        back_populates="answers",
    )
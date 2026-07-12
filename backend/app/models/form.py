from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FormStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class Form(Base):
    __tablename__ = "forms"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="Untitled form",
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    slug: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=FormStatus.DRAFT.value,
        index=True,
    )

    thank_you_title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="Thank you!",
    )

    thank_you_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default="Your response has been submitted.",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    questions: Mapped[list["Question"]] = relationship(
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Question.position",
        passive_deletes=True,
    )

    responses: Mapped[list["FormResponse"]] = relationship(
        back_populates="form",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
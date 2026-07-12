from uuid import uuid4

from slugify import slugify
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.form import Form


def generate_unique_slug(
    db: Session,
    title: str,
    exclude_form_id: int | None = None,
) -> str:
    """
    Generate a unique, URL-friendly slug for a form.

    Examples:
        "Customer Feedback" -> "customer-feedback"
        Duplicate title -> "customer-feedback-a1b2c3"

    Args:
        db: Active SQLAlchemy database session.
        title: Form title used to generate the slug.
        exclude_form_id: Form ID to ignore while updating an existing form.

    Returns:
        A unique slug string.
    """

    base_slug = slugify(title).strip("-")

    if not base_slug:
        base_slug = "untitled-form"

    candidate = base_slug

    while True:
        query = select(Form.id).where(
            Form.slug == candidate
        )

        if exclude_form_id is not None:
            query = query.where(
                Form.id != exclude_form_id
            )

        existing_form_id = db.scalar(query)

        if existing_form_id is None:
            return candidate

        candidate = (
            f"{base_slug}-{uuid4().hex[:6]}"
        )
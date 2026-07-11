from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.form import Form, FormStatus
from app.models.question import Question, QuestionOption
from app.models.response import FormResponse
from app.schemas.form import FormCreate, FormUpdate
from app.utils.slug import generate_unique_slug


def _form_query_with_relations():
    """
    Base query that loads a form together with its questions,
    question options, and responses.
    """
    return select(Form).options(
        selectinload(Form.questions).selectinload(Question.options),
        selectinload(Form.responses),
    )


def get_form_or_404(
    db: Session,
    form_id: int,
) -> Form:
    """
    Return a form by ID.

    Raises:
        HTTPException: If the form does not exist.
    """
    query = _form_query_with_relations().where(
        Form.id == form_id
    )

    form = db.scalar(query)

    if form is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found.",
        )

    return form


def get_form_by_slug_or_404(
    db: Session,
    slug: str,
    published_only: bool = False,
) -> Form:
    """
    Return a form by public slug.

    When published_only=True, draft forms are not returned.
    """
    query = _form_query_with_relations().where(
        Form.slug == slug
    )

    if published_only:
        query = query.where(
            Form.status == FormStatus.PUBLISHED.value
        )

    form = db.scalar(query)

    if form is None:
        detail = (
            "Published form not found."
            if published_only
            else "Form not found."
        )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )

    return form


def create_form(
    db: Session,
    form_data: FormCreate,
) -> Form:
    """
    Create a new draft form with optional initial questions.
    """
    form = Form(
        title=form_data.title,
        description=form_data.description,
        slug=generate_unique_slug(
            db=db,
            title=form_data.title,
        ),
        status=FormStatus.DRAFT.value,
        thank_you_title=form_data.thank_you_title,
        thank_you_description=form_data.thank_you_description,
    )

    db.add(form)
    db.flush()

    for question_index, question_data in enumerate(
        form_data.questions
    ):
        question = Question(
            form_id=form.id,
            type=question_data.type,
            title=question_data.title,
            description=question_data.description,
            required=question_data.required,
            position=question_data.position,
        )

        db.add(question)
        db.flush()

        for option_index, option_data in enumerate(
            question_data.options
        ):
            option = QuestionOption(
                question_id=question.id,
                label=option_data.label,
                position=option_data.position,
            )
            db.add(option)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_form_or_404(
        db=db,
        form_id=form.id,
    )


def list_forms(
    db: Session,
) -> list[dict[str, Any]]:
    """
    Return forms for the creator dashboard with:
    - question count
    - response count
    """

    response_count_subquery = (
        select(
            FormResponse.form_id.label("form_id"),
            func.count(FormResponse.id).label(
                "response_count"
            ),
        )
        .group_by(FormResponse.form_id)
        .subquery()
    )

    question_count_subquery = (
        select(
            Question.form_id.label("form_id"),
            func.count(Question.id).label(
                "question_count"
            ),
        )
        .group_by(Question.form_id)
        .subquery()
    )

    query = (
        select(
            Form,
            func.coalesce(
                response_count_subquery.c.response_count,
                0,
            ).label("response_count"),
            func.coalesce(
                question_count_subquery.c.question_count,
                0,
            ).label("question_count"),
        )
        .outerjoin(
            response_count_subquery,
            response_count_subquery.c.form_id == Form.id,
        )
        .outerjoin(
            question_count_subquery,
            question_count_subquery.c.form_id == Form.id,
        )
        .order_by(Form.updated_at.desc())
    )

    rows = db.execute(query).all()

    forms: list[dict[str, Any]] = []

    for form, response_count, question_count in rows:
        forms.append(
            {
                "id": form.id,
                "title": form.title,
                "description": form.description,
                "slug": form.slug,
                "status": form.status,
                "response_count": response_count,
                "question_count": question_count,
                "created_at": form.created_at,
                "updated_at": form.updated_at,
            }
        )

    return forms


def update_form(
    db: Session,
    form_id: int,
    form_data: FormUpdate,
) -> Form:
    """
    Update editable form properties.

    The slug is regenerated when the title changes.
    """
    form = get_form_or_404(
        db=db,
        form_id=form_id,
    )

    update_data = form_data.model_dump(
        exclude_unset=True
    )

    if "title" in update_data:
        new_title = update_data["title"].strip()

        if not new_title:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Form title cannot be empty.",
            )

        update_data["title"] = new_title

        if new_title != form.title:
            form.slug = generate_unique_slug(
                db=db,
                title=new_title,
                exclude_form_id=form.id,
            )

    for field_name, value in update_data.items():
        setattr(form, field_name, value)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_form_or_404(
        db=db,
        form_id=form.id,
    )


def rename_form(
    db: Session,
    form_id: int,
    title: str,
) -> Form:
    """
    Rename a form and regenerate its slug.
    """
    clean_title = title.strip()

    if not clean_title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Form title cannot be empty.",
        )

    form = get_form_or_404(
        db=db,
        form_id=form_id,
    )

    form.title = clean_title
    form.slug = generate_unique_slug(
        db=db,
        title=clean_title,
        exclude_form_id=form.id,
    )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_form_or_404(
        db=db,
        form_id=form.id,
    )


def publish_form(
    db: Session,
    form_id: int,
) -> Form:
    """
    Publish a form.

    A form must contain at least one question before publishing.
    """
    form = get_form_or_404(
        db=db,
        form_id=form_id,
    )

    if not form.questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "A form must contain at least one question "
                "before publishing."
            ),
        )

    form.status = FormStatus.PUBLISHED.value

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_form_or_404(
        db=db,
        form_id=form.id,
    )


def unpublish_form(
    db: Session,
    form_id: int,
) -> Form:
    """
    Move a published form back to draft status.

    Existing responses remain stored.
    """
    form = get_form_or_404(
        db=db,
        form_id=form_id,
    )

    form.status = FormStatus.DRAFT.value

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_form_or_404(
        db=db,
        form_id=form.id,
    )


def duplicate_form(
    db: Session,
    form_id: int,
) -> Form:
    """
    Duplicate a form with all questions and options.

    Submitted responses are not copied.
    The duplicated form is always created as a draft.
    """
    original_form = get_form_or_404(
        db=db,
        form_id=form_id,
    )

    copied_title = f"{original_form.title} Copy"

    copied_form = Form(
        title=copied_title,
        description=original_form.description,
        slug=generate_unique_slug(
            db=db,
            title=copied_title,
        ),
        status=FormStatus.DRAFT.value,
        thank_you_title=original_form.thank_you_title,
        thank_you_description=(
            original_form.thank_you_description
        ),
    )

    db.add(copied_form)
    db.flush()

    for original_question in original_form.questions:
        copied_question = Question(
            form_id=copied_form.id,
            type=original_question.type,
            title=original_question.title,
            description=original_question.description,
            required=original_question.required,
            position=original_question.position,
        )

        db.add(copied_question)
        db.flush()

        for original_option in original_question.options:
            copied_option = QuestionOption(
                question_id=copied_question.id,
                label=original_option.label,
                position=original_option.position,
            )
            db.add(copied_option)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_form_or_404(
        db=db,
        form_id=copied_form.id,
    )


def delete_form(
    db: Session,
    form_id: int,
) -> None:
    """
    Delete a form and all dependent records through cascade rules.
    """
    form = get_form_or_404(
        db=db,
        form_id=form_id,
    )

    db.delete(form)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise


def get_form_response_count(
    db: Session,
    form_id: int,
) -> int:
    """
    Return the number of submitted responses for a form.
    """
    get_form_or_404(
        db=db,
        form_id=form_id,
    )

    query = select(
        func.count(FormResponse.id)
    ).where(
        FormResponse.form_id == form_id
    )

    return db.scalar(query) or 0


def get_form_question_count(
    db: Session,
    form_id: int,
) -> int:
    """
    Return the number of questions in a form.
    """
    get_form_or_404(
        db=db,
        form_id=form_id,
    )

    query = select(
        func.count(Question.id)
    ).where(
        Question.form_id == form_id
    )

    return db.scalar(query) or 0
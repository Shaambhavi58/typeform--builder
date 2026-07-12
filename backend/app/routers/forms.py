from __future__ import annotations

import os

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.form import (
    FormCreate,
    FormDeleteResponse,
    FormDuplicateResponse,
    FormListItem,
    FormPublishResponse,
    FormRead,
    FormUnpublishResponse,
    FormUpdate,
)
from app.services.form_service import (
    create_form,
    delete_form,
    duplicate_form,
    get_form_or_404,
    list_forms,
    publish_form,
    unpublish_form,
    update_form,
)


router = APIRouter(
    prefix="/api/forms",
    tags=["Forms"],
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000",
).rstrip("/")


@router.get(
    "",
    response_model=list[FormListItem],
    summary="List all forms",
)
def get_all_forms(
    db: Session = Depends(get_db),
):
    """
    Return all forms for the creator dashboard.

    Each form includes:

    - Draft or published status
    - Number of questions
    - Number of responses
    - Creation and modification timestamps
    """

    return list_forms(db=db)


@router.post(
    "",
    response_model=FormRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a form",
)
def create_new_form(
    form_data: FormCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new form.

    A form can optionally include initial questions and question
    options. Newly created forms always begin in draft status.
    """

    return create_form(
        db=db,
        form_data=form_data,
    )


@router.get(
    "/{form_id}",
    response_model=FormRead,
    summary="Get a form",
)
def get_form(
    form_id: int,
    db: Session = Depends(get_db),
):
    """
    Return one form with all its questions and options.
    """

    return get_form_or_404(
        db=db,
        form_id=form_id,
    )


@router.patch(
    "/{form_id}",
    response_model=FormRead,
    summary="Update or rename a form",
)
def edit_form(
    form_id: int,
    form_data: FormUpdate,
    db: Session = Depends(get_db),
):
    """
    Update form-level fields.

    This endpoint can update:

    - Form title
    - Description
    - Thank-you screen title
    - Thank-you screen description

    Changing the title also regenerates the public slug.
    """

    return update_form(
        db=db,
        form_id=form_id,
        form_data=form_data,
    )


@router.post(
    "/{form_id}/duplicate",
    response_model=FormDuplicateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate a form",
)
def duplicate_existing_form(
    form_id: int,
    db: Session = Depends(get_db),
):
    """
    Duplicate a form together with its questions and options.

    Responses are not duplicated. The copied form is created as a
    draft.
    """

    copied_form = duplicate_form(
        db=db,
        form_id=form_id,
    )

    return FormDuplicateResponse(
        id=copied_form.id,
        title=copied_form.title,
        slug=copied_form.slug,
        status="draft",
        message="Form duplicated successfully.",
    )


@router.post(
    "/{form_id}/publish",
    response_model=FormPublishResponse,
    summary="Publish a form",
)
def publish_existing_form(
    form_id: int,
    db: Session = Depends(get_db),
):
    """
    Publish a form and generate its shareable respondent URL.

    A form must contain at least one question before it can be
    published.
    """

    form = publish_form(
        db=db,
        form_id=form_id,
    )

    public_url = f"{FRONTEND_URL}/form/{form.slug}"

    return FormPublishResponse(
        id=form.id,
        status="published",
        slug=form.slug,
        public_url=public_url,
    )


@router.post(
    "/{form_id}/unpublish",
    response_model=FormUnpublishResponse,
    summary="Unpublish a form",
)
def unpublish_existing_form(
    form_id: int,
    db: Session = Depends(get_db),
):
    """
    Move a published form back to draft status.

    Existing responses remain stored.
    """

    form = unpublish_form(
        db=db,
        form_id=form_id,
    )

    return FormUnpublishResponse(
        id=form.id,
        status="draft",
    )


@router.delete(
    "/{form_id}",
    response_model=FormDeleteResponse,
    summary="Delete a form",
)
def remove_form(
    form_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a form and all its associated questions, options,
    responses, and answers.
    """

    delete_form(
        db=db,
        form_id=form_id,
    )

    return FormDeleteResponse(
        message="Form deleted successfully.",
    )
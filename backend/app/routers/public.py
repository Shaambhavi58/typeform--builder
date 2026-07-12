from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.response import (
    PublicFormRead,
    ResponseRead,
    ResponseSubmit,
    SubmissionSuccess,
)
from app.services.form_service import (
    get_form_by_slug_or_404,
)
from app.services.response_service import (
    submit_response,
)


router = APIRouter(
    prefix="/api/public",
    tags=["Public"],
)


@router.get(
    "/forms/{slug}",
    response_model=PublicFormRead,
    summary="Get published form",
)
def get_public_form(
    slug: str,
    db: Session = Depends(get_db),
):
    """
    Public endpoint.

    Returns a published form together with
    all questions and options.

    Authentication is NOT required.
    """

    return get_form_by_slug_or_404(
        db=db,
        slug=slug,
        published_only=True,
    )


@router.post(
    "/forms/{slug}/responses",
    response_model=SubmissionSuccess,
    summary="Submit form response",
)
def submit_public_response(
    slug: str,
    response_data: ResponseSubmit,
    db: Session = Depends(get_db),
):
    """
    Submit a public response.

    Performs full server-side validation.

    No authentication required.
    """

    response = submit_response(
        db=db,
        slug=slug,
        response_data=response_data,
    )

    return SubmissionSuccess(
        response_id=response.id,
        submitted_at=response.submitted_at,
        message="Response submitted successfully.",
    )


@router.get(
    "/forms/{slug}/thank-you",
    summary="Thank you screen",
)
def get_thank_you_screen(
    slug: str,
    db: Session = Depends(get_db),
):
    """
    Return thank-you screen content
    configured for this form.
    """

    form = get_form_by_slug_or_404(
        db=db,
        slug=slug,
        published_only=True,
    )

    return {
        "title": form.thank_you_title,
        "description": form.thank_you_description,
    }
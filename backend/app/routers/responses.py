from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.response import (
    FormSummaryResponse,
    ResponseListItem,
)
from app.services.response_service import (
    delete_response,
    get_form_summary,
    get_response_details,
    list_form_responses,
)


router = APIRouter(
    prefix="/api/forms/{form_id}/responses",
    tags=["Responses"],
)


@router.get(
    "",
    response_model=list[ResponseListItem],
    summary="List form responses",
)
def get_form_responses(
    form_id: int,
    db: Session = Depends(get_db),
):
    return list_form_responses(
        db=db,
        form_id=form_id,
    )


@router.get(
    "/summary",
    response_model=FormSummaryResponse,
    summary="Get response summary",
)
def get_response_summary(
    form_id: int,
    db: Session = Depends(get_db),
):
    return get_form_summary(
        db=db,
        form_id=form_id,
    )


@router.get(
    "/{response_id}",
    summary="Get one response",
)
def get_single_response(
    form_id: int,
    response_id: int,
    db: Session = Depends(get_db),
):
    return get_response_details(
        db=db,
        form_id=form_id,
        response_id=response_id,
    )


@router.delete(
    "/{response_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a response",
)
def remove_response(
    form_id: int,
    response_id: int,
    db: Session = Depends(get_db),
):
    delete_response(
        db=db,
        form_id=form_id,
        response_id=response_id,
    )

    return None
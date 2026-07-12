from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.question import (
    QuestionCreate,
    QuestionRead,
    QuestionReorderRequest,
    QuestionUpdate,
)
from app.services.question_service import (
    add_question,
    delete_question,
    duplicate_question,
    get_form_question_or_404,
    reorder_questions,
    update_question,
)


router = APIRouter(
    prefix="/api/forms/{form_id}/questions",
    tags=["Questions"],
)


@router.get(
    "/{question_id}",
    response_model=QuestionRead,
    summary="Get one question",
)
def get_question(
    form_id: int,
    question_id: int,
    db: Session = Depends(get_db),
):
    """
    Return one question belonging to a form,
    including its ordered options.
    """

    return get_form_question_or_404(
        db=db,
        form_id=form_id,
        question_id=question_id,
    )


@router.post(
    "",
    response_model=QuestionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add a question",
)
def create_question(
    form_id: int,
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
):
    """
    Add a new question to a form.

    Supported types:

    - short_text
    - long_text
    - multiple_choice
    - dropdown
    - email
    - number
    - yes_no
    - rating
    """

    return add_question(
        db=db,
        form_id=form_id,
        question_data=question_data,
    )


@router.patch(
    "/{question_id}",
    response_model=QuestionRead,
    summary="Update a question",
)
def edit_question(
    form_id: int,
    question_id: int,
    question_data: QuestionUpdate,
    db: Session = Depends(get_db),
):
    """
    Update question fields, including:

    - Type
    - Title
    - Description
    - Required setting
    - Position
    - Options
    """

    return update_question(
        db=db,
        form_id=form_id,
        question_id=question_id,
        question_data=question_data,
    )


@router.post(
    "/reorder",
    response_model=list[QuestionRead],
    summary="Reorder questions",
)
def reorder_form_questions(
    form_id: int,
    reorder_data: QuestionReorderRequest,
    db: Session = Depends(get_db),
):
    """
    Persist the question order after drag-and-drop.

    The request must include every question in the form exactly once,
    with continuous positions beginning from zero.
    """

    return reorder_questions(
        db=db,
        form_id=form_id,
        reorder_data=reorder_data,
    )


@router.post(
    "/{question_id}/duplicate",
    response_model=QuestionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate a question",
)
def duplicate_existing_question(
    form_id: int,
    question_id: int,
    db: Session = Depends(get_db),
):
    """
    Duplicate a question along with its options.

    The copied question is inserted immediately after the original.
    """

    return duplicate_question(
        db=db,
        form_id=form_id,
        question_id=question_id,
    )


@router.delete(
    "/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a question",
)
def remove_question(
    form_id: int,
    question_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a question and compact the positions of the remaining
    questions.
    """

    delete_question(
        db=db,
        form_id=form_id,
        question_id=question_id,
    )

    return None
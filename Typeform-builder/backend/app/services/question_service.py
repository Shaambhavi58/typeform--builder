from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, selectinload

from app.models.question import (
    Question,
    QuestionOption,
    QuestionType,
)
from app.schemas.question import (
    QuestionCreate,
    QuestionReorderRequest,
    QuestionUpdate,
)
from app.services.form_service import get_form_or_404


CHOICE_QUESTION_TYPES = {
    QuestionType.MULTIPLE_CHOICE.value,
    QuestionType.DROPDOWN.value,
}


def _question_query_with_options():
    """Base query that loads a question together with its options."""

    return select(Question).options(
        selectinload(Question.options)
    )


def get_question_or_404(
    db: Session,
    question_id: int,
) -> Question:
    """Return a question by ID or raise a 404 error."""

    query = _question_query_with_options().where(
        Question.id == question_id
    )

    question = db.scalar(query)

    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found.",
        )

    return question


def get_form_question_or_404(
    db: Session,
    form_id: int,
    question_id: int,
) -> Question:
    """
    Return a question only when it belongs to the supplied form.
    """

    query = _question_query_with_options().where(
        Question.id == question_id,
        Question.form_id == form_id,
    )

    question = db.scalar(query)

    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found in this form.",
        )

    return question


def get_next_question_position(
    db: Session,
    form_id: int,
) -> int:
    """Return the next available position in a form."""

    highest_position = db.scalar(
        select(func.max(Question.position)).where(
            Question.form_id == form_id
        )
    )

    if highest_position is None:
        return 0

    return highest_position + 1


def _validate_question_options(
    question_type: str,
    options_count: int,
) -> None:
    """
    Validate whether the supplied question type supports options.
    """

    if (
        question_type in CHOICE_QUESTION_TYPES
        and options_count < 2
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Multiple-choice and dropdown questions "
                "must contain at least two options."
            ),
        )

    if (
        question_type not in CHOICE_QUESTION_TYPES
        and options_count > 0
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Options are only supported for "
                "multiple-choice and dropdown questions."
            ),
        )


def _replace_question_options(
    db: Session,
    question: Question,
    options,
) -> None:
    """
    Delete existing options and replace them with a new ordered list.
    """

    _validate_question_options(
        question_type=question.type,
        options_count=len(options),
    )

    for existing_option in list(question.options):
        db.delete(existing_option)

    db.flush()

    for index, option_data in enumerate(options):
        option = QuestionOption(
            question_id=question.id,
            label=option_data.label.strip(),
            position=index,
        )

        if not option.label:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Question option cannot be empty.",
            )

        db.add(option)


def _normalize_question_positions(
    db: Session,
    form_id: int,
) -> None:
    """
    Reassign continuous positions starting from zero.

    A temporary negative position is used first to avoid collisions
    with the unique form_id + position constraint.
    """

    questions = db.scalars(
        select(Question)
        .where(Question.form_id == form_id)
        .order_by(
            Question.position.asc(),
            Question.id.asc(),
        )
    ).all()

    for index, question in enumerate(questions):
        question.position = -(index + 1)

    db.flush()

    for index, question in enumerate(questions):
        question.position = index

    db.flush()


def add_question(
    db: Session,
    form_id: int,
    question_data: QuestionCreate,
) -> Question:
    """
    Add a question to a form.

    New questions are appended to the end unless a valid position
    is explicitly supplied.
    """

    get_form_or_404(
        db=db,
        form_id=form_id,
    )

    _validate_question_options(
        question_type=question_data.type,
        options_count=len(question_data.options),
    )

    question_count = db.scalar(
        select(func.count(Question.id)).where(
            Question.form_id == form_id
        )
    ) or 0

    requested_position = question_data.position

    if requested_position < 0:
        requested_position = 0

    if requested_position > question_count:
        requested_position = question_count

    existing_questions = db.scalars(
        select(Question)
        .where(
            Question.form_id == form_id,
            Question.position >= requested_position,
        )
        .order_by(Question.position.desc())
    ).all()

    # Move positions temporarily to avoid uniqueness collisions.
    for existing_question in existing_questions:
        existing_question.position = (
            -existing_question.position - 1000
        )

    db.flush()

    for existing_question in existing_questions:
        original_position = (
            -existing_question.position - 1000
        )
        existing_question.position = original_position + 1

    question = Question(
        form_id=form_id,
        type=question_data.type,
        title=question_data.title.strip(),
        description=question_data.description,
        required=question_data.required,
        position=requested_position,
    )

    if not question.title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Question title cannot be empty.",
        )

    db.add(question)
    db.flush()

    for index, option_data in enumerate(
        question_data.options
    ):
        label = option_data.label.strip()

        if not label:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Question option cannot be empty.",
            )

        db.add(
            QuestionOption(
                question_id=question.id,
                label=label,
                position=index,
            )
        )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_question_or_404(
        db=db,
        question_id=question.id,
    )


def update_question(
    db: Session,
    form_id: int,
    question_id: int,
    question_data: QuestionUpdate,
) -> Question:
    """
    Update a question and optionally replace its options.
    """

    question = get_form_question_or_404(
        db=db,
        form_id=form_id,
        question_id=question_id,
    )

    update_data = question_data.model_dump(
        exclude_unset=True
    )

    new_type = update_data.get(
        "type",
        question.type,
    )

    supplied_options = update_data.pop(
        "options",
        None,
    )

    if "title" in update_data:
        clean_title = update_data["title"].strip()

        if not clean_title:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Question title cannot be empty.",
            )

        update_data["title"] = clean_title

    old_position = question.position
    requested_position = update_data.pop(
        "position",
        None,
    )

    for field_name, value in update_data.items():
        setattr(question, field_name, value)

    if supplied_options is not None:
        _replace_question_options(
            db=db,
            question=question,
            options=supplied_options,
        )

    elif new_type not in CHOICE_QUESTION_TYPES:
        for existing_option in list(question.options):
            db.delete(existing_option)

    elif (
        question.type not in CHOICE_QUESTION_TYPES
        and new_type in CHOICE_QUESTION_TYPES
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Options are required when changing to "
                "multiple-choice or dropdown."
            ),
        )

    question.type = new_type

    if requested_position is not None:
        total_questions = db.scalar(
            select(func.count(Question.id)).where(
                Question.form_id == form_id
            )
        ) or 1

        requested_position = max(
            0,
            min(requested_position, total_questions - 1),
        )

        if requested_position != old_position:
            question.position = -1000000
            db.flush()

            if requested_position < old_position:
                questions_to_shift = db.scalars(
                    select(Question)
                    .where(
                        Question.form_id == form_id,
                        Question.id != question.id,
                        Question.position >= requested_position,
                        Question.position < old_position,
                    )
                    .order_by(Question.position.desc())
                ).all()

                for item in questions_to_shift:
                    item.position += 1

            else:
                questions_to_shift = db.scalars(
                    select(Question)
                    .where(
                        Question.form_id == form_id,
                        Question.id != question.id,
                        Question.position > old_position,
                        Question.position <= requested_position,
                    )
                    .order_by(Question.position.asc())
                ).all()

                for item in questions_to_shift:
                    item.position -= 1

            db.flush()
            question.position = requested_position

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_question_or_404(
        db=db,
        question_id=question.id,
    )


def delete_question(
    db: Session,
    form_id: int,
    question_id: int,
) -> None:
    """
    Delete a question and compact the positions of remaining questions.
    """

    question = get_form_question_or_404(
        db=db,
        form_id=form_id,
        question_id=question_id,
    )

    db.delete(question)

    try:
        db.flush()

        _normalize_question_positions(
            db=db,
            form_id=form_id,
        )

        db.commit()
    except Exception:
        db.rollback()
        raise


def reorder_questions(
    db: Session,
    form_id: int,
    reorder_data: QuestionReorderRequest,
) -> list[Question]:
    """
    Reorder all questions in a form.

    This method supports drag-and-drop updates from the frontend.
    """

    get_form_or_404(
        db=db,
        form_id=form_id,
    )

    form_questions = db.scalars(
        select(Question)
        .where(Question.form_id == form_id)
        .order_by(Question.position.asc())
    ).all()

    existing_ids = {
        question.id
        for question in form_questions
    }

    requested_ids = {
        item.question_id
        for item in reorder_data.questions
    }

    if requested_ids != existing_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Reorder request must include every question "
                "in the form exactly once."
            ),
        )

    expected_positions = set(
        range(len(form_questions))
    )

    requested_positions = {
        item.position
        for item in reorder_data.questions
    }

    if requested_positions != expected_positions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Positions must be continuous and start from zero."
            ),
        )

    question_map = {
        question.id: question
        for question in form_questions
    }

    # First assign unique negative positions.
    for index, item in enumerate(
        reorder_data.questions
    ):
        question_map[item.question_id].position = -(index + 1)

    db.flush()

    # Then assign final positions.
    for item in reorder_data.questions:
        question_map[item.question_id].position = item.position

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return db.scalars(
        _question_query_with_options()
        .where(Question.form_id == form_id)
        .order_by(Question.position.asc())
    ).all()


def duplicate_question(
    db: Session,
    form_id: int,
    question_id: int,
) -> Question:
    """
    Duplicate a question and place the copy immediately after it.
    """

    original = get_form_question_or_404(
        db=db,
        form_id=form_id,
        question_id=question_id,
    )

    new_position = original.position + 1

    following_questions = db.scalars(
        select(Question)
        .where(
            Question.form_id == form_id,
            Question.position >= new_position,
        )
        .order_by(Question.position.desc())
    ).all()

    for item in following_questions:
        item.position = -item.position - 1000

    db.flush()

    for item in following_questions:
        original_position = -item.position - 1000
        item.position = original_position + 1

    copied_question = Question(
        form_id=form_id,
        type=original.type,
        title=f"{original.title} Copy",
        description=original.description,
        required=original.required,
        position=new_position,
    )

    db.add(copied_question)
    db.flush()

    for option in original.options:
        db.add(
            QuestionOption(
                question_id=copied_question.id,
                label=option.label,
                position=option.position,
            )
        )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_question_or_404(
        db=db,
        question_id=copied_question.id,
    )
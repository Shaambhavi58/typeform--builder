from __future__ import annotations

import re
from collections import Counter
from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.form import Form, FormStatus
from app.models.question import (
    Question,
    QuestionOption,
    QuestionType,
)
from app.models.response import Answer, FormResponse
from app.schemas.response import ResponseSubmit
from app.services.form_service import (
    get_form_by_slug_or_404,
    get_form_or_404,
)


CHOICE_QUESTION_TYPES = {
    QuestionType.MULTIPLE_CHOICE.value,
    QuestionType.DROPDOWN.value,
}

TEXT_QUESTION_TYPES = {
    QuestionType.SHORT_TEXT.value,
    QuestionType.LONG_TEXT.value,
}

EMAIL_PATTERN = re.compile(
    r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+"
    r"@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$"
)


def _response_query_with_relations():
    """
    Base query that loads a response together with its answers,
    questions and question options.
    """

    return select(FormResponse).options(
        selectinload(FormResponse.answers)
        .selectinload(Answer.question)
        .selectinload(Question.options)
    )


def get_response_or_404(
    db: Session,
    response_id: int,
) -> FormResponse:
    """
    Return a submitted response by ID.
    """

    response = db.scalar(
        _response_query_with_relations().where(
            FormResponse.id == response_id
        )
    )

    if response is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found.",
        )

    return response


def get_form_response_or_404(
    db: Session,
    form_id: int,
    response_id: int,
) -> FormResponse:
    """
    Return a response only when it belongs to the given form.
    """

    response = db.scalar(
        _response_query_with_relations().where(
            FormResponse.id == response_id,
            FormResponse.form_id == form_id,
        )
    )

    if response is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found in this form.",
        )

    return response


def _normalize_answer_value(
    value: str | int | float | bool | None,
) -> str | None:
    """
    Convert supported answer values into the string format stored
    in SQLite.
    """

    if value is None:
        return None

    if isinstance(value, bool):
        return "yes" if value else "no"

    return str(value).strip()


def _validate_required_answer(
    question: Question,
    value: str | None,
) -> None:
    """
    Validate required questions.
    """

    if not question.required:
        return

    if value is None or value.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f'Question "{question.title}" is required.'
            ),
        )


def _validate_email(
    question: Question,
    value: str,
) -> None:
    if not EMAIL_PATTERN.fullmatch(value):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f'Answer for "{question.title}" must be '
                "a valid email address."
            ),
        )


def _validate_number(
    question: Question,
    value: str,
) -> None:
    try:
        float(value)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f'Answer for "{question.title}" must be a number.'
            ),
        )


def _validate_yes_no(
    question: Question,
    value: str,
) -> str:
    normalized = value.lower().strip()

    truthy_values = {"yes", "true", "1"}
    falsy_values = {"no", "false", "0"}

    if normalized in truthy_values:
        return "yes"

    if normalized in falsy_values:
        return "no"

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=(
            f'Answer for "{question.title}" must be yes or no.'
        ),
    )


def _validate_rating(
    question: Question,
    value: str,
) -> str:
    try:
        rating = int(value)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f'Answer for "{question.title}" must be '
                "a whole number from 1 to 5."
            ),
        )

    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f'Rating for "{question.title}" must be '
                "between 1 and 5."
            ),
        )

    return str(rating)


def _validate_choice(
    question: Question,
    value: str,
) -> None:
    allowed_options = {
        option.label.strip()
        for option in question.options
    }

    if value not in allowed_options:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f'Invalid option selected for "{question.title}".'
            ),
        )


def validate_answer(
    question: Question,
    raw_value: str | int | float | bool | None,
) -> str | None:
    """
    Perform server-side validation according to question type.
    """

    value = _normalize_answer_value(raw_value)

    _validate_required_answer(
        question=question,
        value=value,
    )

    if value is None or value == "":
        return None

    if question.type in TEXT_QUESTION_TYPES:
        return value

    if question.type == QuestionType.EMAIL.value:
        _validate_email(
            question=question,
            value=value,
        )
        return value

    if question.type == QuestionType.NUMBER.value:
        _validate_number(
            question=question,
            value=value,
        )
        return value

    if question.type == QuestionType.YES_NO.value:
        return _validate_yes_no(
            question=question,
            value=value,
        )

    if question.type == QuestionType.RATING.value:
        return _validate_rating(
            question=question,
            value=value,
        )

    if question.type in CHOICE_QUESTION_TYPES:
        _validate_choice(
            question=question,
            value=value,
        )
        return value

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=(
            f'Unsupported question type "{question.type}".'
        ),
    )


def submit_response(
    db: Session,
    slug: str,
    response_data: ResponseSubmit,
) -> FormResponse:
    """
    Submit answers for a published public form.

    The operation verifies:
    - the form is published
    - every submitted question belongs to the form
    - required questions are answered
    - each answer matches its question type
    """

    form = get_form_by_slug_or_404(
        db=db,
        slug=slug,
        published_only=True,
    )

    questions = sorted(
        form.questions,
        key=lambda question: question.position,
    )

    question_map = {
        question.id: question
        for question in questions
    }

    supplied_answer_map = {
        answer.question_id: answer.value
        for answer in response_data.answers
    }

    invalid_question_ids = (
        set(supplied_answer_map) - set(question_map)
    )

    if invalid_question_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "One or more submitted questions do not belong "
                "to this form."
            ),
        )

    validated_answers: list[
        tuple[Question, str | None]
    ] = []

    for question in questions:
        raw_value = supplied_answer_map.get(question.id)

        validated_value = validate_answer(
            question=question,
            raw_value=raw_value,
        )

        if validated_value is not None:
            validated_answers.append(
                (question, validated_value)
            )

    form_response = FormResponse(
        form_id=form.id,
    )

    db.add(form_response)
    db.flush()

    for question, value in validated_answers:
        db.add(
            Answer(
                response_id=form_response.id,
                question_id=question.id,
                value=value,
            )
        )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return get_response_or_404(
        db=db,
        response_id=form_response.id,
    )


def list_form_responses(
    db: Session,
    form_id: int,
) -> list[dict[str, Any]]:
    """
    Return response list items for a creator's form.
    """

    get_form_or_404(
        db=db,
        form_id=form_id,
    )

    answer_count_subquery = (
        select(
            Answer.response_id.label("response_id"),
            func.count(Answer.id).label("answer_count"),
        )
        .group_by(Answer.response_id)
        .subquery()
    )

    query = (
        select(
            FormResponse.id,
            FormResponse.submitted_at,
            func.coalesce(
                answer_count_subquery.c.answer_count,
                0,
            ).label("answer_count"),
        )
        .outerjoin(
            answer_count_subquery,
            answer_count_subquery.c.response_id
            == FormResponse.id,
        )
        .where(
            FormResponse.form_id == form_id
        )
        .order_by(
            FormResponse.submitted_at.desc()
        )
    )

    rows = db.execute(query).all()

    return [
        {
            "id": response_id,
            "submitted_at": submitted_at,
            "answer_count": answer_count,
        }
        for response_id, submitted_at, answer_count
        in rows
    ]


def get_response_details(
    db: Session,
    form_id: int,
    response_id: int,
) -> dict[str, Any]:
    """
    Return one full response with question details.
    """

    form = get_form_or_404(
        db=db,
        form_id=form_id,
    )

    response = get_form_response_or_404(
        db=db,
        form_id=form_id,
        response_id=response_id,
    )

    answer_map = {
        answer.question_id: answer.value
        for answer in response.answers
    }

    answers = []

    for question in sorted(
        form.questions,
        key=lambda item: item.position,
    ):
        answers.append(
            {
                "question_id": question.id,
                "question_title": question.title,
                "question_type": question.type,
                "value": answer_map.get(question.id),
            }
        )

    return {
        "id": response.id,
        "form_id": response.form_id,
        "submitted_at": response.submitted_at,
        "answers": answers,
    }


def delete_response(
    db: Session,
    form_id: int,
    response_id: int,
) -> None:
    """
    Delete one submitted response and all its answers.
    """

    response = get_form_response_or_404(
        db=db,
        form_id=form_id,
        response_id=response_id,
    )

    db.delete(response)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise


def _calculate_percentage(
    count: int,
    total: int,
) -> float:
    if total == 0:
        return 0.0

    return round(
        (count / total) * 100,
        2,
    )


def get_form_summary(
    db: Session,
    form_id: int,
) -> dict[str, Any]:
    """
    Generate basic per-question summary statistics.

    Choice and yes/no questions:
        count and percentage for each choice

    Rating and number questions:
        average value

    Text and email questions:
        total answer and skipped counts
    """

    form = get_form_or_404(
        db=db,
        form_id=form_id,
    )

    responses = db.scalars(
        _response_query_with_relations()
        .where(FormResponse.form_id == form_id)
        .order_by(FormResponse.submitted_at.asc())
    ).all()

    total_responses = len(responses)

    answer_values_by_question: dict[int, list[str]] = {
        question.id: []
        for question in form.questions
    }

    for response in responses:
        for answer in response.answers:
            if (
                answer.value is not None
                and answer.value.strip() != ""
            ):
                answer_values_by_question.setdefault(
                    answer.question_id,
                    [],
                ).append(answer.value)

    question_summaries: list[dict[str, Any]] = []

    for question in sorted(
        form.questions,
        key=lambda item: item.position,
    ):
        values = answer_values_by_question.get(
            question.id,
            [],
        )

        total_answers = len(values)
        skipped = total_responses - total_answers

        summary: dict[str, Any] = {
            "question_id": question.id,
            "question_title": question.title,
            "question_type": question.type,
            "total_answers": total_answers,
            "skipped": skipped,
            "choices": None,
            "average": None,
        }

        if question.type in CHOICE_QUESTION_TYPES:
            counts = Counter(values)

            summary["choices"] = [
                {
                    "option": option.label,
                    "count": counts.get(
                        option.label,
                        0,
                    ),
                    "percentage": _calculate_percentage(
                        count=counts.get(
                            option.label,
                            0,
                        ),
                        total=total_answers,
                    ),
                }
                for option in sorted(
                    question.options,
                    key=lambda item: item.position,
                )
            ]

        elif question.type == QuestionType.YES_NO.value:
            counts = Counter(
                value.lower()
                for value in values
            )

            summary["choices"] = [
                {
                    "option": option,
                    "count": counts.get(option, 0),
                    "percentage": _calculate_percentage(
                        count=counts.get(option, 0),
                        total=total_answers,
                    ),
                }
                for option in ["yes", "no"]
            ]

        elif question.type in {
            QuestionType.RATING.value,
            QuestionType.NUMBER.value,
        }:
            numeric_values: list[float] = []

            for value in values:
                try:
                    numeric_values.append(float(value))
                except ValueError:
                    continue

            if numeric_values:
                summary["average"] = round(
                    sum(numeric_values)
                    / len(numeric_values),
                    2,
                )

        question_summaries.append(summary)

    return {
        "form_id": form.id,
        "total_responses": total_responses,
        "questions": question_summaries,
    }


def get_total_response_count(
    db: Session,
) -> int:
    """
    Return total responses across every form.
    """

    return (
        db.scalar(
            select(
                func.count(FormResponse.id)
            )
        )
        or 0
    )
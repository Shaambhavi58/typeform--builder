from __future__ import annotations

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models.form import Form, FormStatus
from app.models.question import Question, QuestionOption, QuestionType
from app.models.response import Answer, FormResponse


def create_question(
    form: Form,
    question_type: str,
    title: str,
    position: int,
    required: bool = False,
    description: str | None = None,
    options: list[str] | None = None,
) -> Question:
    """
    Create a question object with optional choices.
    """

    question = Question(
        type=question_type,
        title=title,
        description=description,
        required=required,
        position=position,
    )

    if options:
        question.options = [
            QuestionOption(
                label=label,
                position=index,
            )
            for index, label in enumerate(options)
        ]

    form.questions.append(question)

    return question


def seed_customer_feedback_form() -> Form:
    """
    Create a published customer-feedback form with mixed question types.
    """

    form = Form(
        title="Customer Feedback",
        description=(
            "We would love to hear about your experience with our product."
        ),
        slug="customer-feedback",
        status=FormStatus.PUBLISHED.value,
        thank_you_title="Thanks for your feedback!",
        thank_you_description=(
            "Your response helps us build a better experience."
        ),
    )

    create_question(
        form=form,
        question_type=QuestionType.SHORT_TEXT.value,
        title="What is your name?",
        description="You may enter your first name only.",
        required=True,
        position=0,
    )

    create_question(
        form=form,
        question_type=QuestionType.EMAIL.value,
        title="What is your email address?",
        description="We will only use it to follow up on your feedback.",
        required=True,
        position=1,
    )

    create_question(
        form=form,
        question_type=QuestionType.RATING.value,
        title="How would you rate your overall experience?",
        description="Choose a rating from 1 to 5.",
        required=True,
        position=2,
    )

    create_question(
        form=form,
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        title="Which part of the product did you like the most?",
        required=True,
        position=3,
        options=[
            "Ease of use",
            "Design",
            "Performance",
            "Customer support",
        ],
    )

    create_question(
        form=form,
        question_type=QuestionType.LONG_TEXT.value,
        title="What can we improve?",
        description="Share any ideas or suggestions.",
        required=False,
        position=4,
    )

    create_question(
        form=form,
        question_type=QuestionType.YES_NO.value,
        title="Would you recommend us to a friend?",
        required=True,
        position=5,
    )

    return form


def seed_event_registration_form() -> Form:
    """
    Create a second published form.
    """

    form = Form(
        title="Tech Meetup Registration",
        description=(
            "Register for our upcoming software engineering meetup."
        ),
        slug="tech-meetup-registration",
        status=FormStatus.PUBLISHED.value,
        thank_you_title="You are registered!",
        thank_you_description=(
            "We will send the event details to your email."
        ),
    )

    create_question(
        form=form,
        question_type=QuestionType.SHORT_TEXT.value,
        title="What is your full name?",
        required=True,
        position=0,
    )

    create_question(
        form=form,
        question_type=QuestionType.EMAIL.value,
        title="What is your email?",
        required=True,
        position=1,
    )

    create_question(
        form=form,
        question_type=QuestionType.DROPDOWN.value,
        title="Which role best describes you?",
        required=True,
        position=2,
        options=[
            "Student",
            "Frontend Developer",
            "Backend Developer",
            "Full Stack Developer",
            "Product Manager",
            "Other",
        ],
    )

    create_question(
        form=form,
        question_type=QuestionType.NUMBER.value,
        title="How many years of experience do you have?",
        required=False,
        position=3,
    )

    create_question(
        form=form,
        question_type=QuestionType.YES_NO.value,
        title="Will you attend in person?",
        required=True,
        position=4,
    )

    return form


def seed_draft_form() -> Form:
    """
    Create one draft form for the dashboard.
    """

    form = Form(
        title="Employee Satisfaction Survey",
        description="An internal employee experience survey.",
        slug="employee-satisfaction-survey",
        status=FormStatus.DRAFT.value,
        thank_you_title="Thank you!",
        thank_you_description="Your response has been recorded.",
    )

    create_question(
        form=form,
        question_type=QuestionType.RATING.value,
        title="How satisfied are you with your role?",
        required=True,
        position=0,
    )

    return form


def add_response(
    form: Form,
    values_by_position: dict[int, str],
) -> None:
    """
    Add one sample response to a form.

    values_by_position maps question position to answer value.
    """

    response = FormResponse()

    for question in form.questions:
        if question.position not in values_by_position:
            continue

        response.answers.append(
            Answer(
                question=question,
                value=values_by_position[question.position],
            )
        )

    form.responses.append(response)


def seed_responses(
    customer_feedback: Form,
    event_registration: Form,
) -> None:
    """
    Add sample responses to published forms.
    """

    add_response(
        form=customer_feedback,
        values_by_position={
            0: "Aarav",
            1: "aarav@example.com",
            2: "5",
            3: "Ease of use",
            4: "The mobile layout could be improved.",
            5: "yes",
        },
    )

    add_response(
        form=customer_feedback,
        values_by_position={
            0: "Meera",
            1: "meera@example.com",
            2: "4",
            3: "Design",
            4: "Please add more customization options.",
            5: "yes",
        },
    )

    add_response(
        form=customer_feedback,
        values_by_position={
            0: "Kabir",
            1: "kabir@example.com",
            2: "3",
            3: "Performance",
            5: "no",
        },
    )

    add_response(
        form=event_registration,
        values_by_position={
            0: "Riya Sharma",
            1: "riya@example.com",
            2: "Student",
            3: "0",
            4: "yes",
        },
    )

    add_response(
        form=event_registration,
        values_by_position={
            0: "Arjun Mehta",
            1: "arjun@example.com",
            2: "Backend Developer",
            3: "2",
            4: "yes",
        },
    )


def seed_database() -> None:
    """
    Seed the SQLite database.

    The function is idempotent: if forms already exist, it does not
    insert duplicate seed data.
    """

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        existing_form = db.scalar(
            select(Form.id).limit(1)
        )

        if existing_form is not None:
            print("Database already contains data. Seed skipped.")
            return

        customer_feedback = seed_customer_feedback_form()
        event_registration = seed_event_registration_form()
        draft_form = seed_draft_form()

        db.add_all(
            [
                customer_feedback,
                event_registration,
                draft_form,
            ]
        )

        db.flush()

        seed_responses(
            customer_feedback=customer_feedback,
            event_registration=event_registration,
        )

        db.commit()

        print("Database seeded successfully.")
        print("Published forms:")
        print(
            "  http://localhost:3000/form/customer-feedback"
        )
        print(
            "  http://localhost:3000/form/tech-meetup-registration"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
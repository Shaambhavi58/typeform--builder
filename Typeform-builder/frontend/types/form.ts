export type FormStatus = "draft" | "published";

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export interface QuestionOption {
  id?: number;
  label: string;
  position: number;
}

export interface Question {
  id: number;
  form_id: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  position: number;
  options: QuestionOption[];
}

export interface FormListItem {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  status: FormStatus;
  response_count: number;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface Form {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  status: FormStatus;
  thank_you_title: string;
  thank_you_description: string | null;
  created_at: string;
  updated_at: string;
  questions: Question[];
}

export interface CreateFormPayload {
  title: string;
  description?: string | null;
  thank_you_title?: string;
  thank_you_description?: string | null;
  questions?: CreateQuestionPayload[];
}

export interface UpdateFormPayload {
  title?: string;
  description?: string | null;
  thank_you_title?: string;
  thank_you_description?: string | null;
}

export interface CreateQuestionPayload {
  type: QuestionType;
  title: string;
  description?: string | null;
  required?: boolean;
  position: number;
  options?: Array<{
    label: string;
    position: number;
  }>;
}

export interface UpdateQuestionPayload {
  type?: QuestionType;
  title?: string;
  description?: string | null;
  required?: boolean;
  position?: number;
  options?: Array<{
    label: string;
    position: number;
  }>;
}

export interface PublishFormResponse {
  id: number;
  status: "published";
  slug: string;
  public_url: string;
}

export interface ReorderQuestionsPayload {
  questions: Array<{
    question_id: number;
    position: number;
  }>;
}

export interface AnswerPayload {
  question_id: number;
  value: string | number | boolean | null;
}

export interface SubmitResponsePayload {
  answers: AnswerPayload[];
}

export interface SubmissionSuccess {
  response_id: number;
  submitted_at: string;
  message: string;
}

export interface ResponseListItem {
  id: number;
  submitted_at: string;
  answer_count: number;
}

export interface ResponseAnswer {
  question_id: number;
  question_title: string;
  question_type: QuestionType;
  value: string | null;
}

export interface ResponseDetails {
  id: number;
  form_id: number;
  submitted_at: string;
  answers: ResponseAnswer[];
}

export interface ChoiceSummary {
  option: string;
  count: number;
  percentage: number;
}

export interface QuestionSummary {
  question_id: number;
  question_title: string;
  question_type: QuestionType;
  total_answers: number;
  skipped: number;
  choices: ChoiceSummary[] | null;
  average: number | null;
}

export interface FormSummary {
  form_id: number;
  total_responses: number;
  questions: QuestionSummary[];
}
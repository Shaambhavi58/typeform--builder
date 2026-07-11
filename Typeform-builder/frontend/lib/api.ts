import axios from "axios";

import type {
  CreateFormPayload,
  CreateQuestionPayload,
  Form,
  FormListItem,
  FormSummary,
  PublishFormResponse,
  Question,
  ReorderQuestionsPayload,
  ResponseDetails,
  ResponseListItem,
  SubmissionSuccess,
  SubmitResponsePayload,
  UpdateFormPayload,
  UpdateQuestionPayload,
} from "@/types/form";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ??
      error.message ??
      "Something went wrong.";

    return Promise.reject(new Error(message));
  },
);

export const formsApi = {
  getAll: async (): Promise<FormListItem[]> => {
    const response = await api.get<FormListItem[]>("/api/forms");
    return response.data;
  },

  getById: async (formId: number): Promise<Form> => {
    const response = await api.get<Form>(`/api/forms/${formId}`);
    return response.data;
  },

  create: async (payload: CreateFormPayload): Promise<Form> => {
    const response = await api.post<Form>("/api/forms", payload);
    return response.data;
  },

  update: async (
    formId: number,
    payload: UpdateFormPayload,
  ): Promise<Form> => {
    const response = await api.patch<Form>(
      `/api/forms/${formId}`,
      payload,
    );
    return response.data;
  },

  delete: async (formId: number): Promise<void> => {
    await api.delete(`/api/forms/${formId}`);
  },

  duplicate: async (formId: number) => {
    const response = await api.post(`/api/forms/${formId}/duplicate`);
    return response.data;
  },

  publish: async (formId: number): Promise<PublishFormResponse> => {
    const response = await api.post<PublishFormResponse>(
      `/api/forms/${formId}/publish`,
    );
    return response.data;
  },

  unpublish: async (formId: number) => {
    const response = await api.post(`/api/forms/${formId}/unpublish`);
    return response.data;
  },
};

export const questionsApi = {
  create: async (
    formId: number,
    payload: CreateQuestionPayload,
  ): Promise<Question> => {
    const response = await api.post<Question>(
      `/api/forms/${formId}/questions`,
      payload,
    );
    return response.data;
  },

  update: async (
    formId: number,
    questionId: number,
    payload: UpdateQuestionPayload,
  ): Promise<Question> => {
    const response = await api.patch<Question>(
      `/api/forms/${formId}/questions/${questionId}`,
      payload,
    );
    return response.data;
  },

  delete: async (
    formId: number,
    questionId: number,
  ): Promise<void> => {
    await api.delete(
      `/api/forms/${formId}/questions/${questionId}`,
    );
  },

  duplicate: async (
    formId: number,
    questionId: number,
  ): Promise<Question> => {
    const response = await api.post<Question>(
      `/api/forms/${formId}/questions/${questionId}/duplicate`,
    );
    return response.data;
  },

  reorder: async (
    formId: number,
    payload: ReorderQuestionsPayload,
  ): Promise<Question[]> => {
    const response = await api.post<Question[]>(
      `/api/forms/${formId}/questions/reorder`,
      payload,
    );
    return response.data;
  },
};

export const publicFormsApi = {
  getBySlug: async (slug: string): Promise<Form> => {
    const response = await api.get<Form>(
      `/api/public/forms/${slug}`,
    );
    return response.data;
  },

  submit: async (
    slug: string,
    payload: SubmitResponsePayload,
  ): Promise<SubmissionSuccess> => {
    const response = await api.post<SubmissionSuccess>(
      `/api/public/forms/${slug}/responses`,
      payload,
    );
    return response.data;
  },

  getThankYou: async (
    slug: string,
  ): Promise<{
    title: string;
    description: string | null;
  }> => {
    const response = await api.get(
      `/api/public/forms/${slug}/thank-you`,
    );
    return response.data;
  },
};

export const responsesApi = {
  getAll: async (formId: number): Promise<ResponseListItem[]> => {
    const response = await api.get<ResponseListItem[]>(
      `/api/forms/${formId}/responses`,
    );
    return response.data;
  },

  getById: async (
    formId: number,
    responseId: number,
  ): Promise<ResponseDetails> => {
    const response = await api.get<ResponseDetails>(
      `/api/forms/${formId}/responses/${responseId}`,
    );
    return response.data;
  },

  getSummary: async (formId: number): Promise<FormSummary> => {
    const response = await api.get<FormSummary>(
      `/api/forms/${formId}/responses/summary`,
    );
    return response.data;
  },

  delete: async (
    formId: number,
    responseId: number,
  ): Promise<void> => {
    await api.delete(
      `/api/forms/${formId}/responses/${responseId}`,
    );
  },
};
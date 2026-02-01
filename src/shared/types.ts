export type Id = string;

export interface QuizSummary {
  id: Id;
  title: string;
  createdAt: string;
  updatedAt: string;
  questionCount: number;
}

export interface Quiz {
  id: Id;
  title: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}

export interface Question {
  id: Id;
  quizId: Id;
  text: string;
  orderIndex: number;
  options: Option[];
  createdAt: string;
  updatedAt: string;
}

export interface Option {
  id: Id;
  questionId: Id;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuizCreateInput {
  title: string;
}

export interface QuizUpdateInput {
  id: Id;
  title: string;
}

export interface QuestionSaveInput {
  quizId: Id;
  questionId?: Id;
  text: string;
  options: Array<{
    id?: Id;
    text: string;
    isCorrect: boolean;
    orderIndex: number;
  }>;
}

export interface QuestionReorderInput {
  quizId: Id;
  questionId: Id;
  direction: "up" | "down";
}

export interface OptionReorderInput {
  quizId: Id;
  questionId: Id;
  optionId: Id;
  direction: "up" | "down";
}

export interface QuizResultAnswer {
  questionId: Id;
  selectedOptionId: Id | null;
  correctOptionId: Id;
  isCorrect: boolean;
}

export interface QuizResult {
  id: Id;
  quizId: Id;
  createdAt: string;
  answers: QuizResultAnswer[];
  correctCount: number;
  totalCount: number;
}

export interface QuizResultSaveInput {
  quizId: Id;
  answers: Array<{
    questionId: Id;
    selectedOptionId: Id | null;
    correctOptionId: Id;
  }>;
}

export interface QuizResultsSummary {
  quizId: Id;
  lastResult?: QuizResult;
  attemptCount: number;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] };

export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: ValidationError[] };

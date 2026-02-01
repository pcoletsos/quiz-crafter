export {};

declare global {
  interface Window {
    quizCrafter: {
      getAppVersion: () => Promise<string>;
      listQuizzes: () => Promise<import("../shared/types").IpcResult<import("../shared/types").QuizSummary[]>>;
      getQuiz: (id: string) => Promise<import("../shared/types").IpcResult<import("../shared/types").Quiz>>;
      createQuiz: (payload: import("../shared/types").QuizCreateInput) => Promise<import("../shared/types").IpcResult<import("../shared/types").QuizSummary>>;
      updateQuiz: (payload: import("../shared/types").QuizUpdateInput) => Promise<import("../shared/types").IpcResult<import("../shared/types").QuizSummary>>;
      deleteQuiz: (id: string) => Promise<import("../shared/types").IpcResult<{ id: string }>>;
      saveQuestion: (payload: import("../shared/types").QuestionSaveInput) => Promise<import("../shared/types").IpcResult<import("../shared/types").Question>>;
      reorderQuestion: (payload: import("../shared/types").QuestionReorderInput) => Promise<import("../shared/types").IpcResult<import("../shared/types").Quiz>>;
      reorderOption: (payload: import("../shared/types").OptionReorderInput) => Promise<import("../shared/types").IpcResult<import("../shared/types").Question>>;
      saveResults: (payload: import("../shared/types").QuizResultSaveInput) => Promise<import("../shared/types").IpcResult<import("../shared/types").QuizResult>>;
      getResultsSummary: (quizId: string) => Promise<import("../shared/types").IpcResult<import("../shared/types").QuizResultsSummary>>;
    };
  }
}

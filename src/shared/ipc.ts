export const IPC_CHANNELS = {
  getAppVersion: "app:getVersion",
  quizList: "quiz:list",
  quizGet: "quiz:get",
  quizCreate: "quiz:create",
  quizUpdate: "quiz:update",
  quizDelete: "quiz:delete",
  questionSave: "question:save",
  questionReorder: "question:reorder",
  optionReorder: "option:reorder",
  resultsSave: "results:save",
  resultsGet: "results:get",
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

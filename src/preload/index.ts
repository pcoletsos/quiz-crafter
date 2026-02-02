import { contextBridge, ipcRenderer } from "electron";
import type {
  IpcResult,
  Question,
  QuestionReorderInput,
  QuizResult,
  QuizResultSaveInput,
  QuizResultsSummary,
  QuestionSaveInput,
  Quiz,
  QuizCreateInput,
  QuizSummary,
  QuizUpdateInput,
  OptionReorderInput,
} from "../shared/types";

const IPC_CHANNELS = {
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

contextBridge.exposeInMainWorld("quizCrafter", {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.getAppVersion),
  listQuizzes: (): Promise<IpcResult<QuizSummary[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.quizList),
  getQuiz: (id: string): Promise<IpcResult<Quiz>> =>
    ipcRenderer.invoke(IPC_CHANNELS.quizGet, id),
  createQuiz: (payload: QuizCreateInput): Promise<IpcResult<QuizSummary>> =>
    ipcRenderer.invoke(IPC_CHANNELS.quizCreate, payload),
  updateQuiz: (payload: QuizUpdateInput): Promise<IpcResult<QuizSummary>> =>
    ipcRenderer.invoke(IPC_CHANNELS.quizUpdate, payload),
  deleteQuiz: (id: string): Promise<IpcResult<{ id: string }>> =>
    ipcRenderer.invoke(IPC_CHANNELS.quizDelete, id),
  saveQuestion: (payload: QuestionSaveInput): Promise<IpcResult<Question>> =>
    ipcRenderer.invoke(IPC_CHANNELS.questionSave, payload),
  reorderQuestion: (payload: QuestionReorderInput): Promise<IpcResult<Quiz>> =>
    ipcRenderer.invoke(IPC_CHANNELS.questionReorder, payload),
  reorderOption: (payload: OptionReorderInput): Promise<IpcResult<Question>> =>
    ipcRenderer.invoke(IPC_CHANNELS.optionReorder, payload),
  saveResults: (payload: QuizResultSaveInput): Promise<IpcResult<QuizResult>> =>
    ipcRenderer.invoke(IPC_CHANNELS.resultsSave, payload),
  getResultsSummary: (quizId: string): Promise<IpcResult<QuizResultsSummary>> =>
    ipcRenderer.invoke(IPC_CHANNELS.resultsGet, quizId),
});

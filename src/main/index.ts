import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { IPC_CHANNELS } from "../shared/ipc";
import type {
  IpcResult,
  Question,
  QuestionReorderInput,
  Quiz,
  QuizCreateInput,
  QuizResult,
  QuizResultSaveInput,
  QuizResultsSummary,
  QuizSummary,
  QuizUpdateInput,
  QuestionSaveInput,
  OptionReorderInput,
} from "../shared/types";
import { validateQuestion, validateQuizTitle } from "../shared/validation";
import { initDatabase } from "./db/connection";
import {
  createQuiz,
  deleteQuiz,
  getQuiz,
  getResultsSummary,
  listQuizzes,
  reorderOption,
  reorderQuestion,
  saveQuestion,
  saveResults,
  updateQuiz,
} from "./db/repository";

const resolveDatabasePath = () => path.join(app.getPath("userData"), "quiz-crafter.sqlite");

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "../../preload/preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../../renderer/index.html"));
  } else {
    const devUrl = process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173";
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
};

app.whenReady().then(() => {
  try {
    initDatabase(resolveDatabasePath());
  } catch (error) {
    console.error("Failed to initialize database.", error);
    app.quit();
    return;
  }
  ipcMain.handle(IPC_CHANNELS.getAppVersion, () => app.getVersion());

  ipcMain.handle(IPC_CHANNELS.quizList, (): IpcResult<QuizSummary[]> => {
    return { ok: true, data: listQuizzes() };
  });

  ipcMain.handle(
    IPC_CHANNELS.quizGet,
    (_event, quizId: string): IpcResult<Quiz> => {
      const quiz = getQuiz(quizId);
      if (!quiz) {
        return {
          ok: false,
          errors: [{ field: "quizId", code: "not_found", message: "Quiz not found." }],
        };
      }
      return { ok: true, data: quiz };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.quizCreate,
    (_event, payload: QuizCreateInput): IpcResult<QuizSummary> => {
      const validation = validateQuizTitle(payload.title ?? "");
      if (!validation.ok) {
        return { ok: false, errors: validation.errors };
      }
      return { ok: true, data: createQuiz(payload) };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.quizUpdate,
    (_event, payload: QuizUpdateInput): IpcResult<QuizSummary> => {
      const validation = validateQuizTitle(payload.title ?? "");
      if (!validation.ok) {
        return { ok: false, errors: validation.errors };
      }
      const updated = updateQuiz(payload);
      if (!updated) {
        return {
          ok: false,
          errors: [{ field: "id", code: "not_found", message: "Quiz not found." }],
        };
      }
      return { ok: true, data: updated };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.quizDelete,
    (_event, quizId: string): IpcResult<{ id: string }> => {
      if (!deleteQuiz(quizId)) {
        return {
          ok: false,
          errors: [{ field: "quizId", code: "not_found", message: "Quiz not found." }],
        };
      }
      return { ok: true, data: { id: quizId } };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.questionSave,
    (_event, payload: QuestionSaveInput): IpcResult<Question> => {
      const quiz = getQuiz(payload.quizId);
      if (!quiz) {
        return {
          ok: false,
          errors: [{ field: "quizId", code: "not_found", message: "Quiz not found." }],
        };
      }

      const validation = validateQuestion(payload);
      if (!validation.ok) {
        return { ok: false, errors: validation.errors };
      }

      return { ok: true, data: saveQuestion(payload) };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.questionReorder,
    (_event, payload: QuestionReorderInput): IpcResult<Quiz> => {
      const quiz = getQuiz(payload.quizId);
      if (!quiz) {
        return {
          ok: false,
          errors: [{ field: "quizId", code: "not_found", message: "Quiz not found." }],
        };
      }

      const reordered = reorderQuestion(payload.quizId, payload.questionId, payload.direction);
      if (!reordered) {
        return {
          ok: false,
          errors: [
            { field: "questionId", code: "not_found", message: "Question not found." },
          ],
        };
      }
      return { ok: true, data: reordered };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.optionReorder,
    (_event, payload: OptionReorderInput): IpcResult<Question> => {
      const quiz = getQuiz(payload.quizId);
      if (!quiz) {
        return {
          ok: false,
          errors: [{ field: "quizId", code: "not_found", message: "Quiz not found." }],
        };
      }

      const reordered = reorderOption(
        payload.quizId,
        payload.questionId,
        payload.optionId,
        payload.direction,
      );
      if (!reordered) {
        return {
          ok: false,
          errors: [
            { field: "optionId", code: "not_found", message: "Option not found." },
          ],
        };
      }
      return { ok: true, data: reordered };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.resultsSave,
    (_event, payload: QuizResultSaveInput): IpcResult<QuizResult> => {
      const quiz = getQuiz(payload.quizId);
      if (!quiz) {
        return {
          ok: false,
          errors: [{ field: "quizId", code: "not_found", message: "Quiz not found." }],
        };
      }
      return { ok: true, data: saveResults(payload) };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.resultsGet,
    (_event, quizId: string): IpcResult<QuizResultsSummary> => {
      const quiz = getQuiz(quizId);
      if (!quiz) {
        return {
          ok: false,
          errors: [{ field: "quizId", code: "not_found", message: "Quiz not found." }],
        };
      }
      return { ok: true, data: getResultsSummary(quizId) };
    },
  );

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

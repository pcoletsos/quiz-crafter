import { app, BrowserWindow, ipcMain } from "electron";
import { randomUUID } from "crypto";
import path from "path";
import { IPC_CHANNELS } from "../shared/ipc";
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
import { validateQuestion, validateQuizTitle } from "../shared/validation";

const quizzes = new Map<string, Quiz>();
const quizResults = new Map<string, QuizResult[]>();

const nowIso = () => new Date().toISOString();

const toSummary = (quiz: Quiz): QuizSummary => ({
  id: quiz.id,
  title: quiz.title,
  createdAt: quiz.createdAt,
  updatedAt: quiz.updatedAt,
  questionCount: quiz.questions.length,
});

const reorderList = <T extends { orderIndex: number }>(
  items: T[],
  itemIndex: number,
  direction: "up" | "down",
): boolean => {
  const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return false;
  }

  const current = items[itemIndex];
  const target = items[targetIndex];
  const temp = current.orderIndex;
  current.orderIndex = target.orderIndex;
  target.orderIndex = temp;
  items[itemIndex] = target;
  items[targetIndex] = current;
  return true;
};

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
  ipcMain.handle(IPC_CHANNELS.getAppVersion, () => app.getVersion());

  ipcMain.handle(IPC_CHANNELS.quizList, (): IpcResult<QuizSummary[]> => {
    const summaries = Array.from(quizzes.values()).map(toSummary);
    return { ok: true, data: summaries };
  });

  ipcMain.handle(
    IPC_CHANNELS.quizGet,
    (_event, quizId: string): IpcResult<Quiz> => {
      const quiz = quizzes.get(quizId);
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

      const id = randomUUID();
      const timestamp = nowIso();
      const quiz: Quiz = {
        id,
        title: payload.title.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
        questions: [],
      };
      quizzes.set(id, quiz);
      return { ok: true, data: toSummary(quiz) };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.quizUpdate,
    (_event, payload: QuizUpdateInput): IpcResult<QuizSummary> => {
      const quiz = quizzes.get(payload.id);
      if (!quiz) {
        return {
          ok: false,
          errors: [{ field: "id", code: "not_found", message: "Quiz not found." }],
        };
      }

      const validation = validateQuizTitle(payload.title ?? "");
      if (!validation.ok) {
        return { ok: false, errors: validation.errors };
      }

      quiz.title = payload.title.trim();
      quiz.updatedAt = nowIso();
      return { ok: true, data: toSummary(quiz) };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.quizDelete,
    (_event, quizId: string): IpcResult<{ id: string }> => {
      if (!quizzes.has(quizId)) {
        return {
          ok: false,
          errors: [{ field: "quizId", code: "not_found", message: "Quiz not found." }],
        };
      }
      quizzes.delete(quizId);
      return { ok: true, data: { id: quizId } };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.questionSave,
    (_event, payload: QuestionSaveInput): IpcResult<Question> => {
      const quiz = quizzes.get(payload.quizId);
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

      const timestamp = nowIso();
      let question = quiz.questions.find((item) => item.id === payload.questionId);
      if (!question) {
        question = {
          id: payload.questionId ?? randomUUID(),
          quizId: quiz.id,
          text: payload.text.trim(),
          orderIndex: quiz.questions.length,
          options: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        quiz.questions.push(question);
      }

      question.text = payload.text.trim();
      question.updatedAt = timestamp;
      question.options = payload.options.map((option, index) => ({
        id: option.id ?? randomUUID(),
        questionId: question!.id,
        text: option.text.trim(),
        isCorrect: option.isCorrect,
        orderIndex: option.orderIndex ?? index,
      }));

      quiz.updatedAt = timestamp;
      return { ok: true, data: question };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.questionReorder,
    (_event, payload: QuestionReorderInput): IpcResult<Quiz> => {
      const quiz = quizzes.get(payload.quizId);
      if (!quiz) {
        return {
          ok: false,
          errors: [{ field: "quizId", code: "not_found", message: "Quiz not found." }],
        };
      }

      const index = quiz.questions.findIndex((item) => item.id === payload.questionId);
      if (index === -1) {
        return {
          ok: false,
          errors: [
            { field: "questionId", code: "not_found", message: "Question not found." },
          ],
        };
      }

      const changed = reorderList(quiz.questions, index, payload.direction);
      if (changed) {
        quiz.questions.forEach((item, idx) => {
          item.orderIndex = idx;
        });
        quiz.updatedAt = nowIso();
      }

      return { ok: true, data: quiz };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.optionReorder,
    (_event, payload: OptionReorderInput): IpcResult<Question> => {
      const quiz = quizzes.get(payload.quizId);
      if (!quiz) {
        return {
          ok: false,
          errors: [{ field: "quizId", code: "not_found", message: "Quiz not found." }],
        };
      }

      const question = quiz.questions.find((item) => item.id === payload.questionId);
      if (!question) {
        return {
          ok: false,
          errors: [
            { field: "questionId", code: "not_found", message: "Question not found." },
          ],
        };
      }

      const index = question.options.findIndex((item) => item.id === payload.optionId);
      if (index === -1) {
        return {
          ok: false,
          errors: [
            { field: "optionId", code: "not_found", message: "Option not found." },
          ],
        };
      }

      const changed = reorderList(question.options, index, payload.direction);
      if (changed) {
        question.options.forEach((item, idx) => {
          item.orderIndex = idx;
        });
        question.updatedAt = nowIso();
        quiz.updatedAt = nowIso();
      }

      return { ok: true, data: question };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.resultsSave,
    (_event, payload: QuizResultSaveInput): IpcResult<QuizResult> => {
      const quiz = quizzes.get(payload.quizId);
      if (!quiz) {
        return {
          ok: false,
          errors: [{ field: "quizId", code: "not_found", message: "Quiz not found." }],
        };
      }

      const timestamp = nowIso();
      const answers = payload.answers.map((answer) => {
        const isCorrect = answer.selectedOptionId === answer.correctOptionId;
        return { ...answer, isCorrect };
      });
      const correctCount = answers.filter((item) => item.isCorrect).length;
      const result: QuizResult = {
        id: randomUUID(),
        quizId: quiz.id,
        createdAt: timestamp,
        answers,
        correctCount,
        totalCount: answers.length,
      };

      const existing = quizResults.get(quiz.id) ?? [];
      existing.push(result);
      quizResults.set(quiz.id, existing);

      return { ok: true, data: result };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.resultsGet,
    (_event, quizId: string): IpcResult<QuizResultsSummary> => {
      const quiz = quizzes.get(quizId);
      if (!quiz) {
        return {
          ok: false,
          errors: [{ field: "quizId", code: "not_found", message: "Quiz not found." }],
        };
      }

      const results = quizResults.get(quizId) ?? [];
      return {
        ok: true,
        data: {
          quizId,
          lastResult: results[results.length - 1],
          attemptCount: results.length,
        },
      };
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

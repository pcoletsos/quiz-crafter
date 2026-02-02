import { randomUUID } from "crypto";
import type {
  Question,
  QuestionSaveInput,
  Quiz,
  QuizCreateInput,
  QuizResult,
  QuizResultSaveInput,
  QuizResultsSummary,
  QuizSummary,
  QuizUpdateInput,
  Option,
} from "../../shared/types";
import { getDatabase } from "./connection";

const nowIso = () => new Date().toISOString();

type QuizRow = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type QuestionRow = {
  id: string;
  quiz_id: string;
  text: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

type OptionRow = {
  id: string;
  question_id: string;
  text: string;
  is_correct: number;
  order_index: number;
};

type ResultRow = {
  id: string;
  quiz_id: string;
  created_at: string;
  correct_count: number;
  total_count: number;
};

const mapQuiz = (row: any): Quiz => ({
  id: row.id,
  title: row.title,
  description: row.description ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  questions: [],
});

const mapQuestion = (row: any): Question => ({
  id: row.id,
  quizId: row.quiz_id,
  text: row.text,
  orderIndex: row.order_index,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  options: [],
});

const mapOption = (row: any): Option => ({
  id: row.id,
  questionId: row.question_id,
  text: row.text,
  isCorrect: Boolean(row.is_correct),
  orderIndex: row.order_index,
});

export const listQuizzes = (): QuizSummary[] => {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT q.id, q.title, q.description, q.created_at, q.updated_at, COUNT(questions.id) AS question_count
       FROM quizzes q
       LEFT JOIN questions ON questions.quiz_id = q.id
       GROUP BY q.id
       ORDER BY q.updated_at DESC`,
    )
    .all() as Array<QuizRow & { question_count: number }>;

  return rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    questionCount: row.question_count,
  }));
};

export const getQuiz = (quizId: string): Quiz | null => {
  const db = getDatabase();
  const quizRow = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(quizId) as
    | QuizRow
    | undefined;
  if (!quizRow) return null;
  const quiz = mapQuiz(quizRow);

  const questionRows = db
    .prepare("SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index")
    .all(quizId) as QuestionRow[];
  const questions = questionRows.map(mapQuestion);

  if (questions.length > 0) {
    const questionIds = questions.map((q) => q.id);
    const placeholders = questionIds.map(() => "?").join(",");
    const optionRows = db
      .prepare(
        `SELECT * FROM options WHERE question_id IN (${placeholders}) ORDER BY order_index`,
      )
      .all(...questionIds) as OptionRow[];

    const optionsByQuestion = new Map<string, Option[]>();
    for (const row of optionRows) {
      const option = mapOption(row);
      const list = optionsByQuestion.get(option.questionId) ?? [];
      list.push(option);
      optionsByQuestion.set(option.questionId, list);
    }
    for (const question of questions) {
      question.options = optionsByQuestion.get(question.id) ?? [];
    }
  }

  quiz.questions = questions;
  return quiz;
};

export const createQuiz = (payload: QuizCreateInput): QuizSummary => {
  const db = getDatabase();
  const id = randomUUID();
  const timestamp = nowIso();
  db.prepare(
    "INSERT INTO quizzes (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).run(
    id,
    payload.title.trim(),
    payload.description?.trim() ?? null,
    timestamp,
    timestamp,
  );

  return {
    id,
    title: payload.title.trim(),
    description: payload.description?.trim() ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
    questionCount: 0,
  };
};

export const updateQuiz = (payload: QuizUpdateInput): QuizSummary | null => {
  const db = getDatabase();
  const existing = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(payload.id) as
    | QuizRow
    | undefined;
  if (!existing) return null;
  const timestamp = nowIso();
  const nextDescription =
    payload.description === undefined ? existing.description : payload.description?.trim() ?? null;
  db.prepare("UPDATE quizzes SET title = ?, description = ?, updated_at = ? WHERE id = ?").run(
    payload.title.trim(),
    nextDescription,
    timestamp,
    payload.id,
  );
  const count = db
    .prepare("SELECT COUNT(*) as count FROM questions WHERE quiz_id = ?")
    .get(payload.id) as { count: number };
  return {
    id: payload.id,
    title: payload.title.trim(),
    description: nextDescription,
    createdAt: existing.created_at,
    updatedAt: timestamp,
    questionCount: count.count,
  };
};

export const deleteQuiz = (quizId: string): boolean => {
  const db = getDatabase();
  const result = db.prepare("DELETE FROM quizzes WHERE id = ?").run(quizId);
  return result.changes > 0;
};

export const saveQuestion = (payload: QuestionSaveInput): Question => {
  const db = getDatabase();
  const timestamp = nowIso();

  const tx = db.transaction(() => {
    let questionId = payload.questionId ?? "";
    const existing = questionId
      ? db.prepare("SELECT * FROM questions WHERE id = ?").get(questionId)
      : null;

    if (!existing) {
      questionId = questionId || randomUUID();
      const maxOrder = db
        .prepare("SELECT COALESCE(MAX(order_index), -1) AS max_order FROM questions WHERE quiz_id = ?")
        .get(payload.quizId) as { max_order: number };
      const nextOrder = maxOrder.max_order + 1;
      db.prepare(
        `INSERT INTO questions (id, quiz_id, text, order_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(questionId, payload.quizId, payload.text.trim(), nextOrder, timestamp, timestamp);
    } else {
      db.prepare("UPDATE questions SET text = ?, updated_at = ? WHERE id = ?").run(
        payload.text.trim(),
        timestamp,
        questionId,
      );
    }

    const existingOptionRows = db
      .prepare("SELECT id FROM options WHERE question_id = ?")
      .all(questionId) as Array<{ id: string }>;
    const existingOptionIds = new Set(existingOptionRows.map((row) => row.id));
    const nextOptionIds = new Set<string>();

    payload.options.forEach((option) => {
      const optionId = option.id ?? randomUUID();
      nextOptionIds.add(optionId);
      if (existingOptionIds.has(optionId)) {
        db.prepare(
          `UPDATE options SET text = ?, is_correct = ?, order_index = ?
           WHERE id = ?`,
        ).run(
          option.text.trim(),
          option.isCorrect ? 1 : 0,
          option.orderIndex,
          optionId,
        );
      } else {
        db.prepare(
          `INSERT INTO options (id, question_id, text, is_correct, order_index)
           VALUES (?, ?, ?, ?, ?)`,
        ).run(
          optionId,
          questionId,
          option.text.trim(),
          option.isCorrect ? 1 : 0,
          option.orderIndex,
        );
      }
    });

    if (existingOptionIds.size > 0) {
      const idsToDelete = [...existingOptionIds].filter((id) => !nextOptionIds.has(id));
      if (idsToDelete.length > 0) {
        const placeholders = idsToDelete.map(() => "?").join(",");
        db.prepare(`DELETE FROM options WHERE id IN (${placeholders})`).run(...idsToDelete);
      }
    }

    db.prepare("UPDATE quizzes SET updated_at = ? WHERE id = ?").run(
      timestamp,
      payload.quizId,
    );

    return questionId;
  });

  const questionId = tx();
  const questionRow = db.prepare("SELECT * FROM questions WHERE id = ?").get(questionId) as
    | QuestionRow
    | undefined;
  if (!questionRow) {
    throw new Error("Failed to load saved question.");
  }
  const optionRows = db
    .prepare("SELECT * FROM options WHERE question_id = ? ORDER BY order_index")
    .all(questionId) as OptionRow[];
  const question = mapQuestion(questionRow);
  question.options = optionRows.map(mapOption);
  return question;
};

export const reorderQuestion = (
  quizId: string,
  questionId: string,
  direction: "up" | "down",
): Quiz | null => {
  const db = getDatabase();
  const questions = db
    .prepare("SELECT id, order_index FROM questions WHERE quiz_id = ? ORDER BY order_index")
    .all(quizId) as Array<{ id: string; order_index: number }>;
  const index = questions.findIndex((item) => item.id === questionId);
  if (index === -1) return null;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= questions.length) return getQuiz(quizId);

  const current = questions[index];
  const target = questions[targetIndex];
  const tx = db.transaction(() => {
    db.prepare("UPDATE questions SET order_index = ? WHERE id = ?").run(
      target.order_index,
      current.id,
    );
    db.prepare("UPDATE questions SET order_index = ? WHERE id = ?").run(
      current.order_index,
      target.id,
    );
    db.prepare("UPDATE quizzes SET updated_at = ? WHERE id = ?").run(nowIso(), quizId);
  });
  tx();
  return getQuiz(quizId);
};

export const reorderOption = (
  quizId: string,
  questionId: string,
  optionId: string,
  direction: "up" | "down",
): Question | null => {
  const db = getDatabase();
  const options = db
    .prepare(
      "SELECT id, order_index FROM options WHERE question_id = ? ORDER BY order_index",
    )
    .all(questionId) as Array<{ id: string; order_index: number }>;
  const index = options.findIndex((item) => item.id === optionId);
  if (index === -1) return null;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= options.length) {
    const quiz = getQuiz(quizId);
    return quiz?.questions.find((q) => q.id === questionId) ?? null;
  }

  const current = options[index];
  const target = options[targetIndex];
  const tx = db.transaction(() => {
    db.prepare("UPDATE options SET order_index = ? WHERE id = ?").run(
      target.order_index,
      current.id,
    );
    db.prepare("UPDATE options SET order_index = ? WHERE id = ?").run(
      current.order_index,
      target.id,
    );
    db.prepare("UPDATE questions SET updated_at = ? WHERE id = ?").run(nowIso(), questionId);
    db.prepare("UPDATE quizzes SET updated_at = ? WHERE id = ?").run(nowIso(), quizId);
  });
  tx();

  const quiz = getQuiz(quizId);
  return quiz?.questions.find((q) => q.id === questionId) ?? null;
};

export const saveResults = (payload: QuizResultSaveInput): QuizResult => {
  const db = getDatabase();
  const timestamp = nowIso();
  const resultId = randomUUID();

  const answers = payload.answers.map((answer) => ({
    id: randomUUID(),
    result_id: resultId,
    question_id: answer.questionId,
    selected_option_id: answer.selectedOptionId,
    correct_option_id: answer.correctOptionId,
    is_correct: answer.selectedOptionId === answer.correctOptionId ? 1 : 0,
  }));

  const correctCount = answers.filter((answer) => answer.is_correct === 1).length;
  const totalCount = answers.length;

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO results (id, quiz_id, created_at, correct_count, total_count)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(resultId, payload.quizId, timestamp, correctCount, totalCount);

    const insertAnswer = db.prepare(
      `INSERT INTO result_answers
       (id, result_id, question_id, selected_option_id, correct_option_id, is_correct)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );

    for (const answer of answers) {
      insertAnswer.run(
        answer.id,
        answer.result_id,
        answer.question_id,
        answer.selected_option_id,
        answer.correct_option_id,
        answer.is_correct,
      );
    }
  });
  tx();

  return {
    id: resultId,
    quizId: payload.quizId,
    createdAt: timestamp,
    answers: answers.map((answer) => ({
      questionId: answer.question_id,
      selectedOptionId: answer.selected_option_id ?? null,
      correctOptionId: answer.correct_option_id,
      isCorrect: answer.is_correct === 1,
    })),
    correctCount,
    totalCount,
  };
};

export const getResultsSummary = (quizId: string): QuizResultsSummary => {
  const db = getDatabase();
  const resultRow = db
    .prepare(
      "SELECT * FROM results WHERE quiz_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .get(quizId) as ResultRow | undefined;

  if (!resultRow) {
    return { quizId, attemptCount: 0 };
  }

  const answersRows = db
    .prepare(
      "SELECT question_id, selected_option_id, correct_option_id, is_correct FROM result_answers WHERE result_id = ?",
    )
    .all(resultRow.id) as Array<{
      question_id: string;
      selected_option_id: string | null;
      correct_option_id: string;
      is_correct: number;
    }>;

  const result: QuizResult = {
    id: resultRow.id,
    quizId: resultRow.quiz_id,
    createdAt: resultRow.created_at,
    answers: answersRows.map((row: any) => ({
      questionId: row.question_id,
      selectedOptionId: row.selected_option_id ?? null,
      correctOptionId: row.correct_option_id,
      isCorrect: Boolean(row.is_correct),
    })),
    correctCount: resultRow.correct_count,
    totalCount: resultRow.total_count,
  };

  const countRow = db
    .prepare("SELECT COUNT(*) as count FROM results WHERE quiz_id = ?")
    .get(quizId) as { count: number };

  return {
    quizId,
    lastResult: result,
    attemptCount: countRow.count,
  };
};

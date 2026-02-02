import type Database from "better-sqlite3";

export type Migration = {
  id: number;
  sql?: string;
  run?: (db: Database.Database) => void;
};

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        text TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS options (
        id TEXT PRIMARY KEY,
        question_id TEXT NOT NULL,
        text TEXT NOT NULL,
        is_correct INTEGER NOT NULL DEFAULT 0,
        order_index INTEGER NOT NULL,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS results (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        correct_count INTEGER NOT NULL,
        total_count INTEGER NOT NULL,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS result_answers (
        id TEXT PRIMARY KEY,
        result_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        selected_option_id TEXT,
        correct_option_id TEXT NOT NULL,
        is_correct INTEGER NOT NULL,
        FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        FOREIGN KEY (selected_option_id) REFERENCES options(id) ON DELETE SET NULL,
        FOREIGN KEY (correct_option_id) REFERENCES options(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id, order_index);
      CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id, order_index);
      CREATE INDEX IF NOT EXISTS idx_results_quiz_id ON results(quiz_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_result_answers_result_id ON result_answers(result_id);
    `,
  },
  {
    id: 2,
    run: (db) => {
      const columns = db.prepare("PRAGMA table_info(quizzes)").all() as Array<{
        name: string;
      }>;
      const hasDescription = columns.some((column) => column.name === "description");
      if (!hasDescription) {
        db.exec("ALTER TABLE quizzes ADD COLUMN description TEXT");
      }
    },
  },
];

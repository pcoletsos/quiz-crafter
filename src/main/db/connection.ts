import Database from "better-sqlite3";
import { MIGRATIONS } from "./migrations";

let dbInstance: Database.Database | null = null;

export const initDatabase = (dbPath: string) => {
  if (dbInstance) return dbInstance;
  dbInstance = new Database(dbPath);
  dbInstance.pragma("foreign_keys = ON");
  dbInstance.pragma("journal_mode = WAL");
  runMigrations(dbInstance);
  return dbInstance;
};

export const getDatabase = () => {
  if (!dbInstance) {
    throw new Error("Database not initialized.");
  }
  return dbInstance;
};

const runMigrations = (db: Database.Database) => {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);

  const appliedRows = db
    .prepare("SELECT id FROM schema_migrations")
    .all() as Array<{ id: number }>;
  const applied = new Set<number>(appliedRows.map((row) => row.id));

  const insert = db.prepare(
    "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)",
  );

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    for (const migration of MIGRATIONS) {
      if (applied.has(migration.id)) continue;
      if (migration.sql) {
        db.exec(migration.sql);
      }
      if (migration.run) {
        migration.run(db);
      }
      insert.run(migration.id, now);
    }
  });

  tx();
};

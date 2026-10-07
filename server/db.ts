import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

export type Item = {
  id: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type ItemRow = {
  id: number;
  description: string;
  created_at: string;
  updated_at: string;
};

export function openDatabase(filename: string): DatabaseSync {
  const db = new DatabaseSync(filename);
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL CHECK (length(trim(description)) > 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  return db;
}

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function selectItem(db: DatabaseSync, id: number): Item | null {
  const row = db
    .prepare("SELECT id, description, created_at, updated_at FROM items WHERE id = ?")
    .get(id) as ItemRow | undefined;
  return row ? toItem(row) : null;
}

export function listItems(db: DatabaseSync): Item[] {
  const rows = db
    .prepare("SELECT id, description, created_at, updated_at FROM items ORDER BY id DESC")
    .all() as ItemRow[];
  return rows.map(toItem);
}

export function getItem(db: DatabaseSync, id: number): Item | null {
  return selectItem(db, id);
}

export function createItem(db: DatabaseSync, description: string): Item {
  const cleanDescription = description.trim();
  if (!cleanDescription) {
    throw new Error("Description is required");
  }

  const result = db.prepare("INSERT INTO items (description) VALUES (?)").run(cleanDescription);
  const item = selectItem(db, Number(result.lastInsertRowid));
  if (!item) {
    throw new Error("Created item could not be read");
  }
  return item;
}

export function updateItem(db: DatabaseSync, id: number, description: string): Item | null {
  const cleanDescription = description.trim();
  if (!cleanDescription) {
    throw new Error("Description is required");
  }

  const result = db
    .prepare("UPDATE items SET description = ?, updated_at = datetime('now') WHERE id = ?")
    .run(cleanDescription, id);
  return Number(result.changes) > 0 ? selectItem(db, id) : null;
}

export function deleteItem(db: DatabaseSync, id: number): boolean {
  const result = db.prepare("DELETE FROM items WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}

const dataDir = path.join(import.meta.dirname, "data");
mkdirSync(dataDir, { recursive: true });

export const db = openDatabase(path.join(dataDir, "app.sqlite"));

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { createItem, deleteItem, getItem, listItems, openDatabase, updateItem } from "./db.ts";

const dir = mkdtempSync(path.join(tmpdir(), "simple-items-"));
const filename = path.join(dir, "test.sqlite");
const db = openDatabase(filename);

after(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("items", () => {
  it("creates, reads, and lists an item", () => {
    const created = createItem(db, "  Buy milk  ");

    assert.equal(created.description, "Buy milk");
    assert.equal(getItem(db, created.id)?.id, created.id);
    assert.equal(listItems(db)[0]?.id, created.id);
  });

  it("requires a non-empty description", () => {
    assert.throws(() => createItem(db, "  "), /Description is required/);
    assert.throws(() => updateItem(db, 1, "  "), /Description is required/);
  });

  it("updates and deletes an item", () => {
    const created = createItem(db, "Old description");
    const updated = updateItem(db, created.id, "New description");

    assert.equal(updated?.description, "New description");
    assert.equal(deleteItem(db, created.id), true);
    assert.equal(getItem(db, created.id), null);
    assert.equal(deleteItem(db, created.id), false);
  });

  it("creates a description-only item table", () => {
    const columns = db.prepare("PRAGMA table_info(items)").all() as Array<{ name: string }>;
    assert.deepEqual(
      columns.map((column) => column.name),
      ["id", "description", "created_at", "updated_at"],
    );
  });
});

import express from "express";
import { createItem, db, deleteItem, getItem, listItems, updateItem } from "./db.ts";

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", services: { database: "sqlite" } });
});

app.get("/api/items", (_req, res) => {
  res.json(listItems(db));
});

app.get("/api/items/:id", (req, res) => {
  const id = Number(req.params.id);
  const item = Number.isSafeInteger(id) && id > 0 ? getItem(db, id) : null;

  if (!item) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Item not found" } });
    return;
  }

  res.json(item);
});

app.post("/api/items", (req, res) => {
  try {
    const item = createItem(db, typeof req.body?.description === "string" ? req.body.description : "");
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Invalid input",
      },
    });
  }
});

app.put("/api/items/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Item not found" } });
    return;
  }

  try {
    const item = updateItem(db, id, typeof req.body?.description === "string" ? req.body.description : "");
    if (!item) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Item not found" } });
      return;
    }

    res.json(item);
  } catch (error) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Invalid input",
      },
    });
  }
});

app.delete("/api/items/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0 || !deleteItem(db, id)) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Item not found" } });
    return;
  }

  res.json({ deleted: true, id });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`api http://127.0.0.1:${port}`);
});

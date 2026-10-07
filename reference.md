# Interview reference

React, Vite, and SQLite for this project. The prompt on Friday will change the shape. This file is how to make that change without hunting for a migration command.

## Schema changes

There is no migration command. `CREATE TABLE IF NOT EXISTS` in `server/db.ts` runs every time the API starts. It only creates a table that is not already in the file. If `items` already exists, editing that `CREATE TABLE` text does nothing to the file on disk.

During the interview, throw the file away and let the server recreate it.

1. Change the `CREATE TABLE` in `openDatabase` in `server/db.ts`.
2. Delete `server/data/app.sqlite`.
3. Stop `npm run dev` and start it again.

The rows in there are practice data. Say that out loud if you do it: the file has no real data, so you are recreating the schema.

A brand-new table is the one case where you can skip the delete. Add another `CREATE TABLE IF NOT EXISTS` and restart the API. The new table appears. The old `items` table stays as it is.

Keep the rows only when you are adding a column and the existing data matters. Then the `CREATE TABLE` change is not enough. Add the column once, and guard it so a second restart does not crash:

```ts
const columns = db.prepare("PRAGMA table_info(items)").all() as { name: string }[];
if (!columns.some((column) => column.name === "status")) {
  db.exec("ALTER TABLE items ADD COLUMN status TEXT NOT NULL DEFAULT 'open'");
}
```

Also put `status` into the `CREATE TABLE` so a fresh file is born with it. `ALTER TABLE ... ADD COLUMN` is the SQLite change you can do in place. Renaming a column, dropping one, or changing a `CHECK` is slower to get right on a live file. For those, edit `CREATE TABLE`, delete `app.sqlite`, and restart.

Restart matters. Saving `App.tsx` updates the page by itself. Saving `server/db.ts` or `server/index.ts` does not. `npm run dev` starts the API once and leaves it running.

## How the three pieces connect

The browser only talks to Vite at `http://127.0.0.1:5173`. Vite serves the React page. Any request whose path starts with `/api` is forwarded to Express at `http://127.0.0.1:3001`. That is why `fetch("/api/items")` has no host and no CORS setup.

| You change | Where | What you do after |
|---|---|---|
| Page, form, list | `client/src/App.tsx` | Save. The page refreshes. |
| Route or JSON shape | `server/index.ts` | Restart `npm run dev`. |
| Table or query | `server/db.ts` | Restart. Delete `app.sqlite` if an existing table's definition changed. |

SQL columns are `snake_case` (`created_at`). The JSON the page sees is `camelCase` (`createdAt`). `toItem` in `server/db.ts` is the translation. When you add a column, add it in both places.

## React, in this file

`App` is a function that returns the page. React calls it again whenever state changes, and the new return value becomes the page.

`useState` is the memory. This app has five pieces:

- `items` is the list from the database.
- `title` and `details` are what is currently typed. The inputs are controlled: `value={title}` plus `onChange` that calls `setTitle`. The input does not keep its own copy.
- `error` is the message under the form. `null` means show nothing.
- `pending` disables the button while the save request is in flight.

`useEffect(..., [])` runs `load()` once after the first paint. The empty array means "do not run this again on every keystroke." `load` fetches `GET /api/items` and calls `setItems`.

Submit does four things:

1. `event.preventDefault()` stops the browser from navigating away. The type is `SubmitEvent<HTMLFormElement>` because that is the real submit event. `FormEvent` is deprecated in the React 19 types.
2. `POST /api/items` with `{ title, details }`.
3. On success, clear the fields and call `load()` again so the list matches the database.
4. On failure, `setError(...)`. The `finally` block always clears `pending`.

The list uses `key={item.id}`. React uses that id to tell rows apart when the list changes. Conditional rendering is the empty state: `items.length === 0` shows "Nothing saved yet." Otherwise it maps the array.

`{error ? <p className="error">{error}</p> : null}` is the same idea. A condition, then the element, otherwise nothing.

State updates replace values. `setItems` receives a new array from the server. You do not push onto the old array.

If they ask for a second screen, there is no router in this project. A `useState<"list" | "detail">` view switch is faster than installing one during the hour.

## Vite

Vite is the dev server and the translator that turns `App.tsx` into JavaScript the browser can run. You do not compile by hand.

`client/vite.config.ts` sets the site root to `client/`, binds `127.0.0.1:5173`, and proxies `/api` to the Express port. `client/index.html` loads `src/main.tsx`, and `main.tsx` renders `<App />` into `<div id="root">`.

Save a file under `client/` and the open page updates. If the page looks stale, look at the terminal running `npm run dev` before you refresh. A red error there is the real failure.

You will not need a production build on Friday.

## SQLite, the calls you will type

The driver is Node's built-in `node:sqlite`. `DatabaseSync` is synchronous, so the database lines are not `await`ed. There is no ORM.

```ts
db.prepare("INSERT INTO items (title, details) VALUES (?, ?)").run(title, details);
db.prepare("SELECT id, title, details, created_at FROM items WHERE id = ?").get(id);
db.prepare("SELECT id, title, details, created_at FROM items ORDER BY id DESC").all();
db.exec("CREATE TABLE ...");
```

`?` is the placeholder. Pass the value as an argument to `run`, `get`, or `all`. That keeps the SQL and the user text separate.

- `.run()` is for `INSERT`, `UPDATE`, and `DELETE`. `result.lastInsertRowid` is the new id.
- `.get()` is one row, or `undefined` when nothing matched.
- `.all()` is an array of rows.
- `.exec()` is for schema statements that return nothing.

The current table:

```sql
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK (length(title) > 0),
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)
```

`INTEGER PRIMARY KEY AUTOINCREMENT` makes `id`. `NOT NULL` still allows an empty string, which is why title has `CHECK (length(title) > 0)`. `datetime('now')` is UTC. Express also trims the title and returns 400 when it is blank, so a bad form does not have to depend on the SQL exception.

To see the file while the app is running:

```bash
sqlite3 server/data/app.sqlite
```

Then `.schema` and `SELECT * FROM items;`. `.quit` leaves the shell.

## Adding a column

Suppose the prompt says each item has a status.

In `openDatabase`, add the column to `CREATE TABLE`:

```sql
status TEXT NOT NULL DEFAULT 'open'
```

Delete `server/data/app.sqlite` and restart.

Then thread it through:

- `Item` and `ItemRow` in `server/db.ts`. `toItem` maps `status: row.status`.
- The `SELECT` and the `INSERT` gain a `status` column and another `?`.
- `POST /api/items` reads `req.body.status`, the same way it reads `title`.
- `App.tsx` gets `const [status, setStatus] = useState("open")`, a `<select>` or input, and that field inside the `JSON.stringify`.
- The `<li>` shows `item.status`.

## Adding a table

Suppose each item has comments. Add this next to the `items` table:

```ts
db.exec("PRAGMA foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES items(id),
    body TEXT NOT NULL CHECK (length(body) > 0)
  )
`);
```

`PRAGMA foreign_keys = ON` is required on every connection. Without it, SQLite accepts an `item_id` that points at nothing. Put the pragma before any insert.

Restart the API. You can leave `app.sqlite` in place, because `comments` did not exist yet.

Then add `listComments` and `createComment` beside the item functions, plus `GET /api/items/:id/comments` and `POST /api/items/:id/comments`. On the page, a second small form sends `{ body }` to that post URL.

In Express 5 the id comes from the path:

```ts
app.get("/api/items/:id/comments", (req, res) => {
  const itemId = Number(req.params.id);
  res.json(listComments(db, itemId));
});
```

`req.params.id` is a string, so convert it with `Number` before it goes into SQL.

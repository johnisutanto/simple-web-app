# Simple items

A small React and Express app for managing items with one user-provided field:
`description`. Each item also has an ID and created/updated timestamps.

## Run

```bash
npm install
npm test
npm run dev
```

App: http://127.0.0.1:5173

API: http://127.0.0.1:3001

## API

- `POST /api/items` with `{ "description": "..." }` — add an item
- `GET /api/items` — list items
- `GET /api/items/:id` — read one item
- `PUT /api/items/:id` with `{ "description": "..." }` — edit an item
- `DELETE /api/items/:id` — delete an item

Items are stored in SQLite using Node's built-in `node:sqlite` driver. If the
database contains an older schema, delete `server/data/app.sqlite` and restart
the app to create a fresh database.

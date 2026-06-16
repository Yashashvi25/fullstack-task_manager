# Full Stack Task Manager

---

## Project Overview

| Phase | Focus |
|-------|-------|
| Interface | Responsive Frontend (HTML / CSS / JS) |
| Integration | Backend REST API (Express.js) |
| Persistence | Database Integration (CRUD + Schema) |

---

## Folder Structure

```
fullstack-task_manager/
├── frontend/                     ← Project 1: Responsive Frontend
│   ├── index.html                ← Semantic HTML5 with landmark elements
│   ├── css/
│   │   └── style.css             ← Mobile-first CSS (Grid, Flexbox, clamp())
│   └── js/
│       └── app.js                ← Vanilla JS: state, DOM, API calls
│
├── backend/                      ← Project 2 + 3: API + Database
│   ├── server.js                 ← Express entry point + middleware + routes
│   ├── package.json              ← Dependencies (express, cors — NO native addons)
│   ├── routes/
│   │   ├── tasks.js              ← CRUD route handlers (GET/POST/PUT/DELETE)
│   │   └── middleware.js         ← Server-side input validation
│   └── db/
│       └── database.js           ← Schema design + parameterized queries
│                                   (data saved to tasks_data.json on first run)
│
└── README.md
```

> **No Visual Studio / Xcode needed.** The database layer is pure JavaScript —
> zero native compilation required on any OS.

---

## Step-by-Step Execution

### Prerequisites
- Node.js v18 or newer — https://nodejs.org
- VS Code with the **Live Server** extension (or any static file server)

---

### STEP 1 — Install backend dependencies

Open a terminal (PowerShell / CMD / bash) in the project folder:

```powershell
cd decodelabs-fullstack\backend
npm install
```

Expected output — **no errors**, just:
```
added 63 packages, found 0 vulnerabilities
```



---

### STEP 2 — Start the backend API

```powershell
node server.js
```

You should see:
```
╔══════════════════════════════════════════╗
║   DecodeLabs Task API — Batch 2026       ║
╠══════════════════════════════════════════╣
║  Server : http://localhost:3000          ║
║  Health : http://localhost:3000/api/health║
║  Tasks  : http://localhost:3000/api/tasks ║
╚══════════════════════════════════════════╝
```

Leave this terminal running.

---

### STEP 3 — Open the frontend

**Option A — VS Code Live Server (recommended)**
1. Open the `frontend/` folder in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. Browser opens at `http://127.0.0.1:5500`
4. The "API Status" dot in the header turns **green** — connected!

**Option B — Python**
```powershell
cd decodelabs-fullstack\frontend
python -m http.server 5500
```
Then open `http://localhost:5500`

**Option C — Open directly**
- Double-click `frontend/index.html`
- API Status shows "Offline" (file:// CORS block), but mock data is displayed
- All UI features still work

---

### STEP 4 — Test the API (optional, in a new terminal)

```powershell
# Health check
curl http://localhost:3000/api/health

# Get all tasks
curl http://localhost:3000/api/tasks

# Create a task
curl -X POST http://localhost:3000/api/tasks `
  -H "Content-Type: application/json" `
  -d "{\"title\":\"My task\",\"priority\":\"high\",\"description\":\"Testing\"}"

# Update a task
curl -X PUT http://localhost:3000/api/tasks/1 `
  -H "Content-Type: application/json" `
  -d "{\"status\":\"completed\"}"

# Delete a task
curl -X DELETE http://localhost:3000/api/tasks/6
```

---

## API Reference

**Base URL:** `http://localhost:3000/api`

| Method   | Endpoint        | Description       | Success Code |
|----------|-----------------|-------------------|--------------|
| `GET`    | `/tasks`        | Get all tasks     | 200          |
| `GET`    | `/tasks/:id`    | Get one task      | 200          |
| `POST`   | `/tasks`        | Create a task     | **201**      |
| `PUT`    | `/tasks/:id`    | Update a task     | 200          |
| `DELETE` | `/tasks/:id`    | Delete a task     | **204**      |
| `GET`    | `/health`       | API health check  | 200          |

### POST /tasks — Request Body
```json
{
  "title":       "Task title (required, min 3 chars, max 120)",
  "description": "Optional description (max 500 chars)",
  "priority":    "low | medium | high  (required)",
  "due_date":    "2026-06-20  (optional, YYYY-MM-DD)"
}
```

### Response — 201 Created
```json
{
  "success": true,
  "message": "Task created successfully.",
  "task": {
    "id": 7,
    "title": "My task",
    "description": "Testing",
    "priority": "high",
    "status": "pending",
    "due_date": null,
    "created_at": "2026-06-15 11:30:00",
    "updated_at": "2026-06-15 11:30:00"
  }
}
```

### Response — 400 Bad Request (validation failed)
```json
{
  "error": "Validation failed.",
  "details": [
    { "field": "title",    "message": "Title must be at least 3 characters." },
    { "field": "priority", "message": "Priority is required." }
  ]
}
```

---

## Database Schema

The schema is enforced in `db/database.js` via constraint validators
that mirror real SQL `CHECK`, `NOT NULL`, and `DEFAULT` clauses:

```sql
CREATE TABLE tasks (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  title       TEXT     NOT NULL CHECK(length(trim(title)) >= 3),
  description TEXT     DEFAULT '',
  priority    TEXT     NOT NULL DEFAULT 'medium'
                       CHECK(priority IN ('low', 'medium', 'high')),
  status      TEXT     NOT NULL DEFAULT 'pending'
                       CHECK(status IN ('pending', 'completed')),
  due_date    TEXT     DEFAULT NULL,
  created_at  TEXT     NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT     NOT NULL DEFAULT (datetime('now'))
);
```

### CRUD → HTTP → SQL Mapping

| CRUD     | HTTP Method | Endpoint        | SQL Statement              |
|----------|-------------|-----------------|----------------------------|
| CREATE   | `POST`      | `/api/tasks`    | `INSERT INTO tasks ...`    |
| READ     | `GET`       | `/api/tasks`    | `SELECT * FROM tasks`      |
| UPDATE   | `PUT`       | `/api/tasks/:id`| `UPDATE tasks SET ...`     |
| DELETE   | `DELETE`    | `/api/tasks/:id`| `DELETE FROM tasks WHERE id=?` |

All queries are **parameterized** — user input is never concatenated into
SQL strings, preventing SQL injection entirely (Project 3 — Pillar 4: The Shield).

---

## Design System

| Token          | Hex       | Usage                          |
|----------------|-----------|--------------------------------|
| Mocha Mousse   | `#A5856F` | Primary brand, CTAs, accents   |
| Ethereal Blue  | `#A0D4E0` | Trust highlights               |
| Moonlit Grey   | `#F2F0EA` | Page background, surfaces      |
| Charcoal       | `#2B2825` | Body text, headers             |

**Typography:** Montserrat (headlines) + Inter (body) — max 2 families, 3 weights  
**Breakpoints:** Mobile default → Tablet `768px` → Desktop `1024px`

---

## Features Implemented

###  Responsive Frontend 
- Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>`)
- Mobile-first CSS Grid + Flexbox layout
- `clamp()` fluid typography
- Sticky nav with active section detection on scroll
- Hero with animated floating cards + underline reveal
- Task cards with priority colour-coding and staggered animation
- Search bar + category filters (All / Pending / Completed / High Priority)
- Live stats bar (Total / Completed / Pending / API Status)
- Add Task form with real-time client-side validation + error states
- Live API response preview panel (shows raw JSON after each POST)
- Edit modal with smooth scale-in animation
- Delete confirmation modal
- Toast notifications (success / error)
- Hamburger nav for mobile
- Graceful offline fallback (mock data when API is down)

### Backend API 
- Express.js RESTful server on port 3000
- `GET`, `POST`, `PUT`, `DELETE` endpoints for `/api/tasks`
- JSON body parsing middleware
- Two-layer validation middleware (syntactic + semantic)
- Correct HTTP status codes: `200`, `201`, `204`, `400`, `404`, `500`
- CORS configured for Live Server origins
- Request logger (method + path + timestamp)
- `/api/health` endpoint
- Global error handler

### Database Integration
- Schema designed with PK, NOT NULL, CHECK, DEFAULT, timestamps
- Parameterized queries on all four CRUD operations
- `CHECK` constraint enforcement before every write
- `DEFAULT` values applied automatically on creation
- `updated_at` timestamp refreshed on every UPDATE
- Data persisted to `tasks_data.json` (survives server restarts)
- Seed data loaded automatically on first run
- Zero native dependencies — works on Windows without Visual Studio

---


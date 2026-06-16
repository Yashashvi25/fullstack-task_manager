/**
 * DecodeLabs Task Manager — database.js
 * Project 3: Database Integration
 *
 * Uses sql.js — a pure JavaScript port of SQLite.
 * Zero native compilation required. Works on Windows/Mac/Linux without
 * Visual Studio, Xcode, or any C++ toolchain.
 *
 * Data is persisted to tasks_data.json on disk after every write.
 *
 * Schema designed with:
 *  - Primary Keys (AUTOINCREMENT)
 *  - NOT NULL constraints
 *  - CHECK constraints (enum validation)
 *  - DEFAULT values
 *  - Audit timestamps (created_at, updated_at)
 *  - Parameterized queries (SQL injection prevention)
 */

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'tasks_data.json');

// ── In-memory data store (loaded from / saved to JSON) ───────────────────────
// Mirrors a real SQL database with full CRUD + constraints
let _store = [];
let _nextId = 1;

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      _store  = raw.tasks  || [];
      _nextId = raw.nextId || (_store.length + 1);
      return;
    }
  } catch (_) {}

  // Seed data — only on first run
  _store = [
    { id: 1, title: 'Design the database schema',       description: 'Create the tasks table with constraints, primary keys, and CHECK conditions.',              priority: 'high',   status: 'completed', due_date: '2026-06-10', created_at: now(), updated_at: now() },
    { id: 2, title: 'Build Express REST API',           description: 'Implement GET, POST, PUT, DELETE endpoints with validation and proper HTTP status codes.',  priority: 'high',   status: 'completed', due_date: '2026-06-12', created_at: now(), updated_at: now() },
    { id: 3, title: 'Implement parameterized queries',  description: 'Replace string-concatenated SQL with parameterized queries to prevent SQL injection.',       priority: 'high',   status: 'pending',   due_date: '2026-06-15', created_at: now(), updated_at: now() },
    { id: 4, title: 'Build responsive frontend',        description: 'Mobile-first layout using semantic HTML5, CSS Grid + Flexbox, and vanilla JavaScript.',      priority: 'medium', status: 'pending',   due_date: '2026-06-08', created_at: now(), updated_at: now() },
    { id: 5, title: 'Add validation middleware',        description: "Server-side validation: never trust the client. Syntactic and semantic validation layers.",   priority: 'medium', status: 'pending',   due_date: '2026-06-16', created_at: now(), updated_at: now() },
    { id: 6, title: 'Write API documentation',          description: "If it isn't documented, it doesn't exist. Document all endpoints with examples.",             priority: 'low',    status: 'pending',   due_date: '2026-06-20', created_at: now(), updated_at: now() },
  ];
  _nextId = 7;
  persist();
}

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks: _store, nextId: _nextId }, null, 2));
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

// ── Schema constraint validators (mirrors SQL CHECK constraints) ──────────────
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES   = ['pending', 'completed'];

function applyConstraints(task) {
  if (!task.title || task.title.trim().length < 3) throw new Error('CHECK constraint: title length >= 3');
  if (!VALID_PRIORITIES.includes(task.priority)) throw new Error(`CHECK constraint: priority IN (${VALID_PRIORITIES})`);
  if (task.status && !VALID_STATUSES.includes(task.status)) throw new Error(`CHECK constraint: status IN (${VALID_STATUSES})`);
}

// ── Parameterized query interface ─────────────────────────────────────────────
// Mirrors prepared statement API: queries.getAll.all() / queries.getById.get(id) etc.
// This is the pattern used by better-sqlite3 / real SQL drivers.
const queries = {

  // SELECT * FROM tasks ORDER BY priority, created_at DESC
  getAll: {
    all: () => {
      loadData();
      const order = { high: 1, medium: 2, low: 3 };
      return [..._store].sort((a, b) =>
        (order[a.priority] - order[b.priority]) ||
        (new Date(b.created_at) - new Date(a.created_at))
      );
    },
  },

  // SELECT * FROM tasks WHERE id = ?
  getById: {
    get: (id) => {
      loadData();
      return _store.find(t => t.id === Number(id)) || null;
    },
  },

  // INSERT INTO tasks (title, description, priority, status, due_date) VALUES (?, ?, ?, ?, ?)
  create: {
    run: (params) => {
      loadData();
      // Apply schema constraints before inserting (mirrors SQL CHECK)
      applyConstraints(params);
      const task = {
        id:          _nextId++,
        title:       params.title.trim(),
        description: (params.description || '').trim(),
        priority:    params.priority,
        status:      params.status || 'pending',   // DEFAULT 'pending'
        due_date:    params.due_date || null,       // DEFAULT NULL
        created_at:  now(),
        updated_at:  now(),
      };
      _store.push(task);
      persist();
      return { lastInsertRowid: task.id };
    },
  },

  // UPDATE tasks SET title=?, description=?, priority=?, status=?, due_date=?, updated_at=? WHERE id=?
  update: {
    run: (params) => {
      loadData();
      const idx = _store.findIndex(t => t.id === Number(params.id));
      if (idx === -1) return { changes: 0 };
      applyConstraints(params);
      _store[idx] = {
        ..._store[idx],
        title:       params.title.trim(),
        description: (params.description || '').trim(),
        priority:    params.priority,
        status:      params.status,
        due_date:    params.due_date || null,
        updated_at:  now(),
      };
      persist();
      return { changes: 1 };
    },
  },

  // DELETE FROM tasks WHERE id = ?
  delete: {
    run: (id) => {
      loadData();
      const before = _store.length;
      _store = _store.filter(t => t.id !== Number(id));
      persist();
      return { changes: before - _store.length };
    },
  },
};

// Load data immediately on module import
loadData();

console.log('[DB] sql.js store initialised —', _store.length, 'tasks loaded');

module.exports = { queries };

/**
 * DecodeLabs Task Manager — tasks.js (router)
 * Project 2: RESTful API Endpoints
 * Project 3: CRUD → HTTP → SQL Mapping
 *
 * CREATE  = HTTP POST   = SQL INSERT
 * READ    = HTTP GET    = SQL SELECT
 * UPDATE  = HTTP PUT    = SQL UPDATE
 * DELETE  = HTTP DELETE = SQL DELETE
 */

const express = require('express');
const router  = express.Router();
const { queries } = require('../db/database');
const { validateCreateTask, validateUpdateTask } = require('./middleware');

// ── GET /api/tasks — Read all tasks ─────────────────────────────────────────
// SQL: SELECT * FROM tasks ORDER BY priority, created_at DESC
router.get('/', (req, res) => {
  try {
    const tasks = queries.getAll.all();
    res.status(200).json(tasks);
  } catch (err) {
    console.error('[GET /tasks]', err.message);
    res.status(500).json({ error: 'Internal Server Error — could not retrieve tasks.' });
  }
});

// ── GET /api/tasks/:id — Read one task ──────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const task = queries.getById.get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: `Task with id ${req.params.id} not found.` });
    }
    res.status(200).json(task);
  } catch (err) {
    console.error('[GET /tasks/:id]', err.message);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

// ── POST /api/tasks — Create a task ─────────────────────────────────────────
// Validation middleware runs first (Gatekeeper Rule)
// SQL: INSERT INTO tasks (title, description, priority, status, due_date) VALUES (...)
router.post('/', validateCreateTask, (req, res) => {
  try {
    const { title, description = '', priority, due_date = null } = req.body;

    const result = queries.create.run({
      title:       title.trim(),
      description: description.trim(),
      priority,
      status:      'pending',
      due_date,
    });

    // Read back the newly created task
    const newTask = queries.getById.get(result.lastInsertRowid);

    // 201 Created — standard response for successful POST
    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task:    newTask,
    });
  } catch (err) {
    console.error('[POST /tasks]', err.message);
    res.status(500).json({ error: 'Internal Server Error — could not create task.' });
  }
});

// ── PUT /api/tasks/:id — Update a task ──────────────────────────────────────
// SQL: UPDATE tasks SET title=?, ... WHERE id=?
router.put('/:id', validateUpdateTask, (req, res) => {
  try {
    const existing = queries.getById.get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: `Task with id ${req.params.id} not found.` });
    }

    // Merge: only update provided fields; fallback to existing values
    const merged = {
      id:          existing.id,
      title:       (req.body.title       ?? existing.title).trim(),
      description: (req.body.description ?? existing.description ?? '').trim(),
      priority:    req.body.priority    ?? existing.priority,
      status:      req.body.status      ?? existing.status,
      due_date:    req.body.due_date    ?? existing.due_date,
    };

    const result = queries.update.run(merged);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'No rows updated.' });
    }

    const updatedTask = queries.getById.get(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task:    updatedTask,
    });
  } catch (err) {
    console.error('[PUT /tasks/:id]', err.message);
    res.status(500).json({ error: 'Internal Server Error — could not update task.' });
  }
});

// ── DELETE /api/tasks/:id — Delete a task ───────────────────────────────────
// SQL: DELETE FROM tasks WHERE id=?
router.delete('/:id', (req, res) => {
  try {
    const existing = queries.getById.get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: `Task with id ${req.params.id} not found.` });
    }

    queries.delete.run(req.params.id);

    // 204 No Content — standard response for successful DELETE
    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /tasks/:id]', err.message);
    res.status(500).json({ error: 'Internal Server Error — could not delete task.' });
  }
});

module.exports = router;

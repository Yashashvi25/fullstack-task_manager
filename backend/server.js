/**
 * DecodeLabs Task Manager — server.js
 * Project 2: Backend API Development
 * 
 * Express server with:
 *  - CORS for frontend communication
 *  - JSON body parsing
 *  - RESTful route mounting
 *  - Global error handling
 *  - Health check endpoint
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const tasksRouter = require('./routes/tasks');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3001', 'null'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());                        // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ── Request Logger (Development) ─────────────────────────────────────────────
app.use((req, _res, next) => {
  const ts = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${ts}] ${req.method.padEnd(7)} ${req.path}`);
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────

// Health check endpoint — GET /api/health
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status:    'ok',
    service:   'DecodeLabs Task API',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      tasks: {
        'GET    /api/tasks':      'Read all tasks',
        'GET    /api/tasks/:id':  'Read one task',
        'POST   /api/tasks':      'Create a task',
        'PUT    /api/tasks/:id':  'Update a task',
        'DELETE /api/tasks/:id':  'Delete a task',
      },
    },
  });
});

// Tasks CRUD router
app.use('/api/tasks', tasksRouter);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED ERROR]', err.message);
  res.status(500).json({ error: 'Internal Server Error.' });
});

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   DecodeLabs Task API — Batch 2026       ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Server : http://localhost:${PORT}           ║`);
  console.log(`║  Health : http://localhost:${PORT}/api/health║`);
  console.log(`║  Tasks  : http://localhost:${PORT}/api/tasks ║`);
  console.log('╚══════════════════════════════════════════╝\n');
});

module.exports = app;

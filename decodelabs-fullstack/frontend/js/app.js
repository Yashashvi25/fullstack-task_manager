/**
 * DecodeLabs Task Manager — app.js
 * Project 1: Frontend JS (DOM manipulation, state management, interactivity)
 * Connects to Project 2 (Express API) → Project 3 (SQLite DB)
 */

const API_BASE = 'http://localhost:3000/api';

// ─── STATE ──────────────────────────────────────────────────────────────────
let tasks = [];
let currentFilter = 'all';
let deleteTargetId = null;

// ─── ELEMENT REFERENCES ─────────────────────────────────────────────────────
const taskGrid       = document.getElementById('taskGrid');
const loadingState   = document.getElementById('loadingState');
const emptyState     = document.getElementById('emptyState');
const statTotal      = document.getElementById('statTotal');
const statDone       = document.getElementById('statDone');
const statPending    = document.getElementById('statPending');
const statApi        = document.getElementById('statApi');
const searchInput    = document.getElementById('searchInput');
const addTaskForm    = document.getElementById('addTaskForm');
const editTaskForm   = document.getElementById('editTaskForm');
const editModal      = document.getElementById('editModal');
const deleteModal    = document.getElementById('deleteModal');
const toast          = document.getElementById('toast');
const apiPreviewCode = document.getElementById('apiPreviewCode');
const navToggle      = document.getElementById('navToggle');
const navLinks       = document.querySelector('.nav-links');

// ─── HELPERS ────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const icon = type === 'success' ? '✓' : '✕';
  document.getElementById('toastIcon').textContent = icon;
  document.getElementById('toastMsg').textContent = msg;
  toast.className = `toast toast-${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function setApiStatus(status) {
  const dot = statApi.querySelector('.pulse-dot');
  if (status === 'connected') {
    statApi.innerHTML = '<span class="pulse-dot connected"></span> Connected';
  } else if (status === 'error') {
    statApi.innerHTML = '<span class="pulse-dot error"></span> Offline — showing mock data';
  } else {
    statApi.innerHTML = '<span class="pulse-dot"></span> Checking…';
  }
}

function updateStats() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending   = total - completed;

  statTotal.textContent   = total;
  statDone.textContent    = completed;
  statPending.textContent = pending;

  // Animate number change
  [statTotal, statDone, statPending].forEach(el => {
    el.style.transform = 'scale(1.2)';
    setTimeout(() => el.style.transform = 'scale(1)', 150);
  });
}

// ─── MOCK DATA (shown when backend is offline) ───────────────────────────────
const MOCK_TASKS = [
  { id: 1, title: 'Design the database schema', description: 'Create Users and Tasks tables with proper primary/foreign keys and constraints.', priority: 'high', status: 'completed', due_date: '2026-06-10', created_at: new Date().toISOString() },
  { id: 2, title: 'Build Express REST API', description: 'Implement GET, POST, PUT, DELETE endpoints for /api/tasks with input validation.', priority: 'high', status: 'completed', due_date: '2026-06-12', created_at: new Date().toISOString() },
  { id: 3, title: 'Implement CRUD operations', description: 'Write parameterized SQL queries for all four CRUD operations, preventing SQL injection.', priority: 'high', status: 'pending', due_date: '2026-06-15', created_at: new Date().toISOString() },
  { id: 4, title: 'Build responsive frontend', description: 'Create mobile-first HTML/CSS/JS interface using Grid, Flexbox, and the 2025 DecodeLabs palette.', priority: 'medium', status: 'completed', due_date: '2026-06-08', created_at: new Date().toISOString() },
  { id: 5, title: 'Add data validation middleware', description: 'Server-side validation using custom middleware — never trust the client.', priority: 'medium', status: 'pending', due_date: '2026-06-16', created_at: new Date().toISOString() },
  { id: 6, title: 'Write API documentation', description: 'Document all endpoints, request bodies, and response schemas. If it isn\'t documented, it doesn\'t exist.', priority: 'low', status: 'pending', due_date: '2026-06-20', created_at: new Date().toISOString() },
];

// ─── FETCH TASKS (GET /api/tasks) ────────────────────────────────────────────
async function fetchTasks() {
  loadingState.classList.remove('hidden');
  emptyState.classList.add('hidden');
  clearTaskCards();

  try {
    const res = await fetch(`${API_BASE}/tasks`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('Server error');
    tasks = await res.json();
    setApiStatus('connected');
  } catch (err) {
    // Backend not running — use mock data for demo
    tasks = [...MOCK_TASKS];
    setApiStatus('error');
  }

  loadingState.classList.add('hidden');
  updateStats();
  renderTasks();
}

// ─── RENDER TASKS ───────────────────────────────────────────────────────────
function clearTaskCards() {
  taskGrid.querySelectorAll('.task-card').forEach(c => c.remove());
}

function getFilteredTasks() {
  let filtered = [...tasks];

  // Search filter
  const query = searchInput.value.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(query) ||
      (t.description || '').toLowerCase().includes(query)
    );
  }

  // Category filter
  if (currentFilter === 'completed') filtered = filtered.filter(t => t.status === 'completed');
  else if (currentFilter === 'pending') filtered = filtered.filter(t => t.status === 'pending');
  else if (currentFilter === 'high') filtered = filtered.filter(t => t.priority === 'high');

  return filtered;
}

function renderTasks() {
  clearTaskCards();
  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  filtered.forEach((task, idx) => {
    const card = createTaskCard(task, idx);
    taskGrid.appendChild(card);
  });
}

function createTaskCard(task, idx) {
  const card = document.createElement('div');
  card.className = `task-card priority-${task.priority} status-${task.status}`;
  card.style.animationDelay = `${idx * 0.05}s`;
  card.dataset.id = task.id;

  card.innerHTML = `
    <div class="task-id">#${task.id}</div>
    <div class="task-header">
      <h3 class="task-title">${escHtml(task.title)}</h3>
      <span class="task-priority ${task.priority}">${task.priority}</span>
    </div>
    ${task.description ? `<p class="task-desc">${escHtml(task.description)}</p>` : ''}
    <div class="task-meta">
      <span class="task-status ${task.status}">${task.status}</span>
      ${task.due_date ? `<span class="task-due">Due: ${formatDate(task.due_date)}</span>` : ''}
    </div>
    <div class="task-actions">
      <button class="task-btn edit-btn" data-id="${task.id}">Edit</button>
      <button class="task-btn complete-btn" data-id="${task.id}">
        ${task.status === 'completed' ? 'Reopen' : 'Complete'}
      </button>
      <button class="task-btn delete-btn" data-id="${task.id}">Delete</button>
    </div>
  `;

  // Event Listeners
  card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task));
  card.querySelector('.complete-btn').addEventListener('click', () => toggleComplete(task.id));
  card.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(task.id));

  return card;
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── ADD TASK (POST /api/tasks) ──────────────────────────────────────────────
addTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const submitBtn  = document.getElementById('submitBtn');
  const btnText    = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');

  btnText.classList.add('hidden');
  btnSpinner.classList.remove('hidden');
  submitBtn.disabled = true;

  const payload = {
    title:       document.getElementById('taskTitle').value.trim(),
    description: document.getElementById('taskDesc').value.trim(),
    priority:    document.getElementById('taskPriority').value,
    due_date:    document.getElementById('taskDue').value || null,
  };

  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(5000),
    });

    const data = await res.json();
    apiPreviewCode.textContent = JSON.stringify(data, null, 2);

    if (res.ok) {
      tasks.unshift(data.task || { ...payload, id: Date.now(), status: 'pending', created_at: new Date().toISOString() });
      showToast('Task created successfully!');
      addTaskForm.reset();
      updateStats();
      renderTasks();
      document.getElementById('tasks').scrollIntoView({ behavior: 'smooth' });
    } else {
      showToast(data.error || 'Failed to create task', 'error');
    }
  } catch (err) {
    // Offline — add to local state
    const newTask = { ...payload, id: Date.now(), status: 'pending', created_at: new Date().toISOString() };
    tasks.unshift(newTask);
    apiPreviewCode.textContent = JSON.stringify({ success: true, task: newTask, note: 'Saved locally (API offline)' }, null, 2);
    showToast('Task saved locally (API offline)');
    addTaskForm.reset();
    updateStats();
    renderTasks();
    document.getElementById('tasks').scrollIntoView({ behavior: 'smooth' });
  } finally {
    btnText.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
});

function validateForm() {
  let valid = true;

  const title    = document.getElementById('taskTitle');
  const priority = document.getElementById('taskPriority');
  const titleErr = document.getElementById('titleError');
  const priErr   = document.getElementById('priorityError');

  titleErr.textContent = '';
  priErr.textContent   = '';
  title.classList.remove('error');
  priority.classList.remove('error');

  if (!title.value.trim()) {
    titleErr.textContent = 'Task title is required.';
    title.classList.add('error');
    title.focus();
    valid = false;
  } else if (title.value.trim().length < 3) {
    titleErr.textContent = 'Title must be at least 3 characters.';
    title.classList.add('error');
    valid = false;
  }

  if (!priority.value) {
    priErr.textContent = 'Please select a priority level.';
    priority.classList.add('error');
    valid = false;
  }

  return valid;
}

document.getElementById('clearFormBtn').addEventListener('click', () => {
  addTaskForm.reset();
  ['taskTitle', 'taskPriority'].forEach(id => document.getElementById(id).classList.remove('error'));
  ['titleError', 'priorityError'].forEach(id => document.getElementById(id).textContent = '');
  apiPreviewCode.textContent = '// Response will appear here after submission';
});

// ─── TOGGLE COMPLETE (PUT /api/tasks/:id) ────────────────────────────────────
async function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const newStatus = task.status === 'completed' ? 'pending' : 'completed';

  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...task, status: newStatus }),
      signal:  AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error();
  } catch (err) {
    // Offline — update locally
  }

  task.status = newStatus;
  updateStats();
  renderTasks();
  showToast(`Task marked as ${newStatus}`);
}

// ─── EDIT MODAL ──────────────────────────────────────────────────────────────
function openEditModal(task) {
  document.getElementById('editTaskId').value       = task.id;
  document.getElementById('editTitle').value        = task.title;
  document.getElementById('editDesc').value         = task.description || '';
  document.getElementById('editPriority').value     = task.priority;
  document.getElementById('editDue').value          = task.due_date ? task.due_date.split('T')[0] : '';
  document.getElementById('editStatus').value       = task.status;
  editModal.classList.remove('hidden');
}

document.getElementById('modalClose').addEventListener('click',  () => editModal.classList.add('hidden'));
document.getElementById('cancelEdit').addEventListener('click',  () => editModal.classList.add('hidden'));
editModal.addEventListener('click', e => { if (e.target === editModal) editModal.classList.add('hidden'); });

editTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = parseInt(document.getElementById('editTaskId').value);

  const updated = {
    title:       document.getElementById('editTitle').value.trim(),
    description: document.getElementById('editDesc').value.trim(),
    priority:    document.getElementById('editPriority').value,
    due_date:    document.getElementById('editDue').value || null,
    status:      document.getElementById('editStatus').value,
  };

  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(updated),
      signal:  AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error();
  } catch (_) { /* offline */ }

  const idx = tasks.findIndex(t => t.id === id);
  if (idx !== -1) tasks[idx] = { ...tasks[idx], ...updated };

  editModal.classList.add('hidden');
  showToast('Task updated!');
  updateStats();
  renderTasks();
});

// ─── DELETE ──────────────────────────────────────────────────────────────────
function openDeleteModal(id) {
  deleteTargetId = id;
  deleteModal.classList.remove('hidden');
}

document.getElementById('cancelDelete').addEventListener('click',  () => deleteModal.classList.add('hidden'));
deleteModal.addEventListener('click', e => { if (e.target === deleteModal) deleteModal.classList.add('hidden'); });

document.getElementById('confirmDelete').addEventListener('click', async () => {
  const id = deleteTargetId;
  deleteModal.classList.add('hidden');

  try {
    await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(4000),
    });
  } catch (_) { /* offline */ }

  tasks = tasks.filter(t => t.id !== id);
  showToast('Task deleted');
  updateStats();
  renderTasks();
});

// ─── SEARCH & FILTER ─────────────────────────────────────────────────────────
searchInput.addEventListener('input', renderTasks);

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ─── NAV ─────────────────────────────────────────────────────────────────────
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

// Active section on scroll
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 140) current = sec.id;
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === current);
  });
});

// Smooth scroll for hero CTA
document.getElementById('heroCta').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('tasks').scrollIntoView({ behavior: 'smooth' });
});

// ─── INIT ────────────────────────────────────────────────────────────────────
fetchTasks();

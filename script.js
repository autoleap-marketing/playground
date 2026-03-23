// ============================================================
// Todo App - script.js
// ============================================================


// ---- State ----
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let activeModalId = null;  // ID of the todo whose detail modal is open


// ---- Startup Migration ----
// Ensures all existing todos have the new fields (safe for old saved data).
todos = todos.map(function(t) {
  return {
    status:   t.status   || (t.done ? 'completed' : 'pending'),
    details:  t.details  || '',
    subtasks: t.subtasks || [],
    ...t
  };
});
saveTodos();


// ============================================================
// PERSISTENCE
// ============================================================

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}


// ============================================================
// RENDER — redraws both views whenever data changes
// ============================================================

function render() {
  renderList();
  renderKanban();
}

// ---- List View ----
function renderList() {
  const list     = document.getElementById('todo-list');
  const emptyMsg = document.getElementById('empty-msg');
  const status   = document.getElementById('status');

  list.innerHTML = '';
  emptyMsg.style.display = todos.length === 0 ? 'block' : 'none';

  if (todos.length > 0) {
    const remaining = todos.filter(function(t) { return !t.done; }).length;
    status.textContent = remaining + ' of ' + todos.length + ' remaining';
  } else {
    status.textContent = '';
  }

  todos.forEach(function(todo) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');

    // Circle check button
    const checkBtn = document.createElement('button');
    checkBtn.className = 'check-btn';
    checkBtn.title = todo.done ? 'Mark incomplete' : 'Mark complete';
    checkBtn.textContent = todo.done ? '✓' : '';
    checkBtn.addEventListener('click', function() {
      toggleTodo(todo.id);
    });

    // Todo text — click opens detail modal
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;
    span.addEventListener('click', function() {
      openModal(todo.id);
    });

    // Subtask progress badge (only shown when subtasks exist)
    const meta = document.createElement('span');
    meta.className = 'todo-subtask-meta';
    if (todo.subtasks.length > 0) {
      const doneSubs = todo.subtasks.filter(function(s) { return s.done; }).length;
      meta.textContent = doneSubs + '/' + todo.subtasks.length + ' subtasks';
    }

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Delete';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', function() {
      deleteTodo(todo.id);
    });

    li.appendChild(checkBtn);
    li.appendChild(span);
    if (todo.subtasks.length > 0) li.appendChild(meta);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

// ---- Kanban View ----
function renderKanban() {
  const pendingEl    = document.getElementById('cards-pending');
  const inProgressEl = document.getElementById('cards-inprogress');
  const completedEl  = document.getElementById('cards-completed');

  pendingEl.innerHTML    = '';
  inProgressEl.innerHTML = '';
  completedEl.innerHTML  = '';

  // Route each todo to the right column
  const columns = { pending: [], 'in-progress': [], completed: [] };
  todos.forEach(function(todo) {
    const col = columns[todo.status] || columns.pending;
    col.push(todo);
  });

  function fillColumn(el, items) {
    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'kanban-empty';
      empty.textContent = 'Nothing here yet';
      el.appendChild(empty);
    } else {
      items.forEach(function(todo) {
        el.appendChild(createKanbanCard(todo));
      });
    }
  }

  fillColumn(pendingEl,    columns['pending']);
  fillColumn(inProgressEl, columns['in-progress']);
  fillColumn(completedEl,  columns['completed']);
}

// Builds and returns a single kanban card DOM node
function createKanbanCard(todo) {
  const card = document.createElement('div');
  card.className = 'kanban-card';

  // Card title — click opens modal
  const title = document.createElement('div');
  title.className = 'kanban-card-title' + (todo.done ? ' done-title' : '');
  title.textContent = todo.text;
  title.addEventListener('click', function() {
    openModal(todo.id);
  });

  // Subtask progress
  const meta = document.createElement('div');
  meta.className = 'kanban-card-meta';
  if (todo.subtasks.length > 0) {
    const doneSubs = todo.subtasks.filter(function(s) { return s.done; }).length;
    meta.textContent = doneSubs + ' of ' + todo.subtasks.length + ' subtasks done';
  }

  // Status selector
  const select = document.createElement('select');
  select.className = 'status-select';
  [
    { value: 'pending',     label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed',   label: 'Completed' }
  ].forEach(function(opt) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === todo.status) option.selected = true;
    select.appendChild(option);
  });
  select.addEventListener('change', function() {
    setTodoStatus(todo.id, this.value);
  });

  card.appendChild(title);
  if (todo.subtasks.length > 0) card.appendChild(meta);
  card.appendChild(select);
  return card;
}


// ============================================================
// ACTIONS — modify data, save, re-render
// ============================================================

// Add a new todo
function addTodo(text) {
  text = text.trim();
  if (!text) return;

  todos.push({
    id:       Date.now(),
    text:     text,
    done:     false,
    status:   'pending',
    details:  '',
    subtasks: []
  });

  saveTodos();
  render();
}

// Toggle done state (list view checkmark)
function toggleTodo(id) {
  todos = todos.map(function(t) {
    if (t.id !== id) return t;
    const newDone = !t.done;
    // Sync status: completing → "completed"; un-completing → "pending"
    // (leave "in-progress" alone only when un-completing from "in-progress")
    const newStatus = newDone
      ? 'completed'
      : (t.status === 'completed' ? 'pending' : t.status);
    return { ...t, done: newDone, status: newStatus };
  });

  saveTodos();
  render();
}

// Set status from kanban select (also syncs done flag)
function setTodoStatus(id, newStatus) {
  todos = todos.map(function(t) {
    if (t.id !== id) return t;
    return { ...t, status: newStatus, done: newStatus === 'completed' };
  });

  saveTodos();
  render();
}

// Delete a todo
function deleteTodo(id) {
  if (activeModalId === id) closeModal(true);
  todos = todos.filter(function(t) { return t.id !== id; });
  saveTodos();
  render();
}

// Update a single text field on a todo (used by modal)
function updateTodoField(id, field, value) {
  todos = todos.map(function(t) {
    if (t.id !== id) return t;
    const updated = { ...t };
    updated[field] = value;
    return updated;
  });
  saveTodos();
  // Don't call render() here — avoid interrupting user typing in modal
}

// Add a subtask to the active todo
function addSubtask(text) {
  text = text.trim();
  if (!text || activeModalId === null) return;

  todos = todos.map(function(t) {
    if (t.id !== activeModalId) return t;
    return {
      ...t,
      subtasks: t.subtasks.concat({ id: Date.now(), text: text, done: false })
    };
  });

  saveTodos();
  const todo = todos.find(function(t) { return t.id === activeModalId; });
  renderSubtasks(todo);
  renderKanban(); // update subtask count on card
  renderList();   // update subtask count on list item
}

// Toggle a subtask's done state
function toggleSubtask(todoId, subtaskId) {
  todos = todos.map(function(t) {
    if (t.id !== todoId) return t;
    return {
      ...t,
      subtasks: t.subtasks.map(function(s) {
        if (s.id !== subtaskId) return s;
        return { ...s, done: !s.done };
      })
    };
  });

  saveTodos();
  const todo = todos.find(function(t) { return t.id === todoId; });
  renderSubtasks(todo);
  renderKanban();
  renderList();
}

// Delete a subtask
function deleteSubtask(todoId, subtaskId) {
  todos = todos.map(function(t) {
    if (t.id !== todoId) return t;
    return {
      ...t,
      subtasks: t.subtasks.filter(function(s) { return s.id !== subtaskId; })
    };
  });

  saveTodos();
  const todo = todos.find(function(t) { return t.id === todoId; });
  renderSubtasks(todo);
  renderKanban();
  renderList();
}


// ============================================================
// MODAL
// ============================================================

function openModal(id) {
  activeModalId = id;
  const todo = todos.find(function(t) { return t.id === id; });

  document.getElementById('modal-title').value   = todo.text;
  document.getElementById('modal-details').value = todo.details;
  renderSubtasks(todo);

  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-title').focus();
}

// skipRender: true when called from deleteTodo to avoid double render
function closeModal(skipRender) {
  // Flush any in-progress edits from the modal fields before closing
  if (activeModalId !== null) {
    const titleVal   = document.getElementById('modal-title').value;
    const detailsVal = document.getElementById('modal-details').value;
    updateTodoField(activeModalId, 'text',    titleVal);
    updateTodoField(activeModalId, 'details', detailsVal);
  }

  activeModalId = null;
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('subtask-input').value = '';

  if (!skipRender) render();
}

function renderSubtasks(todo) {
  const ul = document.getElementById('modal-subtasks');
  ul.innerHTML = '';

  if (todo.subtasks.length === 0) {
    const empty = document.createElement('li');
    empty.style.cssText = 'color: var(--text-light); font-size: 0.85rem; padding: 8px 4px;';
    empty.textContent = 'No subtasks yet';
    ul.appendChild(empty);
    return;
  }

  todo.subtasks.forEach(function(sub) {
    const li = document.createElement('li');
    li.className = 'subtask-item' + (sub.done ? ' done' : '');

    // Square check button
    const check = document.createElement('button');
    check.className = 'subtask-check';
    check.title = sub.done ? 'Mark incomplete' : 'Mark complete';
    check.textContent = sub.done ? '✓' : '';
    check.addEventListener('click', function() {
      toggleSubtask(todo.id, sub.id);
    });

    // Subtask text
    const span = document.createElement('span');
    span.className = 'subtask-text';
    span.textContent = sub.text;
    span.addEventListener('click', function() {
      toggleSubtask(todo.id, sub.id);
    });

    // Delete subtask
    const del = document.createElement('button');
    del.className = 'subtask-delete-btn';
    del.title = 'Delete subtask';
    del.textContent = '✕';
    del.addEventListener('click', function() {
      deleteSubtask(todo.id, sub.id);
    });

    li.appendChild(check);
    li.appendChild(span);
    li.appendChild(del);
    ul.appendChild(li);
  });
}


// ============================================================
// TAB SWITCHING
// ============================================================

function switchTab(tabName) {
  document.getElementById('view-list').classList.toggle('hidden', tabName !== 'list');
  document.getElementById('view-kanban').classList.toggle('hidden', tabName !== 'kanban');

  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Widen the card for the kanban board
  document.getElementById('app').classList.toggle('kanban-mode', tabName === 'kanban');
}


// ============================================================
// EVENT LISTENERS
// ============================================================

// Add todo
document.getElementById('add-btn').addEventListener('click', function() {
  const input = document.getElementById('todo-input');
  addTodo(input.value);
  input.value = '';
  input.focus();
});

document.getElementById('todo-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    addTodo(this.value);
    this.value = '';
    this.focus();
  }
});

// Tabs
document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    switchTab(this.dataset.tab);
  });
});

// Modal — close button
document.getElementById('modal-close').addEventListener('click', function() {
  closeModal();
});

// Modal — click on dark overlay background (but not the modal itself)
document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// Modal — Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && activeModalId !== null) closeModal();
});

// Modal — flush title edits live
document.getElementById('modal-title').addEventListener('input', function() {
  if (activeModalId !== null) updateTodoField(activeModalId, 'text', this.value);
});

// Modal — flush details edits live
document.getElementById('modal-details').addEventListener('input', function() {
  if (activeModalId !== null) updateTodoField(activeModalId, 'details', this.value);
});

// Subtask add button
document.getElementById('subtask-add-btn').addEventListener('click', function() {
  const input = document.getElementById('subtask-input');
  addSubtask(input.value);
  input.value = '';
  input.focus();
});

// Subtask Enter key
document.getElementById('subtask-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    addSubtask(this.value);
    this.value = '';
    this.focus();
  }
});


// ============================================================
// INIT
// ============================================================
render();

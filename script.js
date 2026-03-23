// ============================================================
// Todo App - script.js
// This file handles all the app's behavior:
//   - Storing todos in a list (array)
//   - Saving/loading from localStorage (so they survive a refresh)
//   - Drawing the list on the page (rendering)
//   - Responding to user actions (add, complete, delete)
// ============================================================


// ---- Data ----
// Load any saved todos from localStorage, or start with an empty list.
// Each todo looks like: { id: 1234567890, text: "Buy milk", done: false }
let todos = JSON.parse(localStorage.getItem('todos')) || [];


// ---- Save ----
// Call this every time the todos array changes so it's never lost.
function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}


// ---- Render ----
// Clears the list on screen and redraws it from the todos array.
// This is the single source of truth — the page always matches the data.
function render() {
  const list = document.getElementById('todo-list');
  const emptyMsg = document.getElementById('empty-msg');
  const status = document.getElementById('status');

  // Clear the current list
  list.innerHTML = '';

  // Show or hide the empty state message
  emptyMsg.style.display = todos.length === 0 ? 'block' : 'none';

  // Update the status line ("X of Y remaining")
  if (todos.length > 0) {
    const remaining = todos.filter(t => !t.done).length;
    status.textContent = `${remaining} of ${todos.length} remaining`;
  } else {
    status.textContent = '';
  }

  // Draw each todo as a list item
  todos.forEach(function(todo) {
    // Create the <li> element
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');

    // Checkmark circle button (marks complete)
    const checkBtn = document.createElement('button');
    checkBtn.className = 'check-btn';
    checkBtn.title = todo.done ? 'Mark incomplete' : 'Mark complete';
    checkBtn.textContent = todo.done ? '✓' : '';
    checkBtn.addEventListener('click', function() {
      toggleTodo(todo.id);
    });

    // Todo text (clicking also toggles complete)
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;
    span.addEventListener('click', function() {
      toggleTodo(todo.id);
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Delete';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', function() {
      deleteTodo(todo.id);
    });

    // Put it all together
    li.appendChild(checkBtn);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}


// ---- Actions ----

// Add a new todo to the list
function addTodo(text) {
  // Trim whitespace and ignore empty input
  text = text.trim();
  if (!text) return;

  // Create a new todo object and add it to the array
  todos.push({
    id: Date.now(),   // unique ID based on current time
    text: text,
    done: false
  });

  saveTodos();
  render();
}

// Toggle a todo between done and not done
function toggleTodo(id) {
  todos = todos.map(function(todo) {
    if (todo.id === id) {
      return { ...todo, done: !todo.done };
    }
    return todo;
  });

  saveTodos();
  render();
}

// Remove a todo from the list
function deleteTodo(id) {
  todos = todos.filter(function(todo) {
    return todo.id !== id;
  });

  saveTodos();
  render();
}


// ---- Event Listeners ----

// "Add" button click
document.getElementById('add-btn').addEventListener('click', function() {
  const input = document.getElementById('todo-input');
  addTodo(input.value);
  input.value = '';       // clear the input after adding
  input.focus();          // put cursor back in the input
});

// Press Enter in the input field
document.getElementById('todo-input').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    const input = document.getElementById('todo-input');
    addTodo(input.value);
    input.value = '';
    input.focus();
  }
});


// ---- Start ----
// Draw the list when the page first loads
render();

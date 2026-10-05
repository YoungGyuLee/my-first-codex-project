const STORAGE_KEY = 'one-step-todos-v1';

const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list = document.querySelector('#todo-list');
const emptyState = document.querySelector('#empty-state');
const remainingCount = document.querySelector('#remaining-count');
const priorityInput = document.querySelector('#priority-input');
const todayInput = document.querySelector('#today-input');
const filterBar = document.querySelector('#filter-bar');
const searchInput = document.querySelector('#search-input');

let todos = loadTodos();
let activeFilter = 'all';

function loadTodos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((todo) => todo && typeof todo.id === 'string' && typeof todo.text === 'string')
      .map((todo) => ({
        id: todo.id,
        text: todo.text,
        completed: Boolean(todo.completed),
        priority: ['low', 'normal', 'high'].includes(todo.priority) ? todo.priority : 'normal',
        today: typeof todo.today === 'boolean' ? todo.today : true,
      }));
  } catch {
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // The list remains usable for this session if browser storage is unavailable.
  }
}

function renderTodos() {
  list.replaceChildren();
  const fragment = document.createDocumentFragment();
  const searchTerm = searchInput.value.trim().toLowerCase();

  const visibleTodos = todos.filter((todo) => {
    const matchesFilter = activeFilter === 'today' ? todo.today
      : activeFilter === 'incomplete' ? !todo.completed
        : activeFilter === 'completed' ? todo.completed
          : activeFilter === 'high' ? todo.priority === 'high'
            : true;
    const matchesSearch = todo.text.toLowerCase().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  visibleTodos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = `todo-item priority-${todo.priority}${todo.completed ? ' is-complete' : ''}${todo.today ? '' : ' is-not-today'}`;

    const checkbox = document.createElement('input');
    checkbox.className = 'todo-check';
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `${todo.text} 완료 표시`);
    checkbox.addEventListener('change', () => {
      todo.completed = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const details = document.createElement('span');
    details.className = 'todo-details';
    const priorityLabel = { low: '낮음', normal: '보통', high: '높음' }[todo.priority];
    details.textContent = `${priorityLabel}${todo.today ? ' · 오늘' : ' · 나중에'}`;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.textContent = '×';
    deleteButton.setAttribute('aria-label', `${todo.text} 삭제`);
    deleteButton.addEventListener('click', () => {
      todos = todos.filter((entry) => entry.id !== todo.id);
      saveTodos();
      renderTodos();
      input.focus();
    });

    item.append(checkbox, text, details, deleteButton);
    fragment.append(item);
  });

  list.append(fragment);
  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `남은 할 일 ${remaining}개`;
  emptyState.hidden = visibleTodos.length > 0;
  list.hidden = visibleTodos.length === 0;
  if (visibleTodos.length === 0 && todos.length > 0) {
    emptyState.textContent = searchTerm
      ? '검색어와 필터에 맞는 할 일이 없어요.'
      : '이 필터에 해당하는 할 일이 없어요.';
  } else {
    emptyState.innerHTML = '아직 할 일이 없어요.<br />새로운 할 일을 추가해 보세요!';
  }
}

filterBar.addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  activeFilter = button.dataset.filter;
  filterBar.querySelectorAll('.filter-button').forEach((filterButton) => {
    const selected = filterButton === button;
    filterButton.classList.toggle('is-active', selected);
    filterButton.setAttribute('aria-pressed', String(selected));
  });
  renderTodos();
});

searchInput.addEventListener('input', renderTodos);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  todos.unshift({
    id: crypto.randomUUID(),
    text,
    completed: false,
    priority: priorityInput.value,
    today: todayInput.checked,
  });
  saveTodos();
  renderTodos();
  form.reset();
  priorityInput.value = 'normal';
  todayInput.checked = true;
  input.focus();
});

renderTodos();

const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const chatMessages = document.querySelector('#chat-messages');
const chatStatus = document.querySelector('#chat-status');
const chatSend = chatForm.querySelector('button');

function addChatMessage(role, content) {
  const message = document.createElement('p');
  message.className = `chat-message ${role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`;
  message.textContent = content;
  chatMessages.append(message);
  message.scrollIntoView({ block: 'nearest' });
}

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message || chatSend.disabled) return;

  chatMessages.querySelector('.chat-welcome')?.remove();
  addChatMessage('user', message);
  chatInput.value = '';
  chatInput.disabled = true;
  chatSend.disabled = true;
  chatStatus.textContent = '답변을 작성하고 있어요…';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '답변을 가져오지 못했어요.');
    addChatMessage('assistant', result.reply);
    chatStatus.textContent = '';
  } catch (error) {
    chatStatus.textContent = error instanceof TypeError
      ? '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.'
      : error.message || '답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.';
  } finally {
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.focus();
  }
});

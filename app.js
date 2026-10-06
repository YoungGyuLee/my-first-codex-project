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
    return normalizeTodos(saved);
  } catch {
    return [];
  }
}

function normalizeTodos(saved) {
  if (!Array.isArray(saved)) return [];
  return saved.filter((todo) => todo && typeof todo.id === 'string' && typeof todo.text === 'string')
    .map((todo) => ({
      id: todo.id,
      text: todo.text,
      completed: Boolean(todo.completed),
      priority: ['low', 'normal', 'high'].includes(todo.priority) ? todo.priority : 'normal',
      today: typeof todo.today === 'boolean' ? todo.today : true,
      ...(typeof todo.date === 'string' ? { date: todo.date } : {}),
      ...(typeof todo.completedAt === 'string' ? { completedAt: todo.completedAt } : {}),
    }));
}

function readLatestTodos() {
  try {
    return normalizeTodos(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return null;
  }
}

function saveTodos(nextTodos = todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTodos));
    return true;
  } catch {
    // The list remains usable for this session if browser storage is unavailable.
    return false;
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

function getTodoContext(todoList = todos) {
  return todoList.map((todo) => ({
    id: todo.id,
    text: todo.text,
    completed: todo.completed,
    priority: todo.priority,
    today: todo.today,
    ...(typeof todo.date === 'string' ? { date: todo.date } : {}),
    ...(typeof todo.completedAt === 'string' ? { completedAt: todo.completedAt } : {}),
  }));
}

const CLIENT_TOOL_NAMES = new Set([
  'create_task', 'update_task', 'complete_task', 'delete_task', 'list_tasks',
]);

function hasExactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isValidTodoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validateClientArguments(name, args, currentTodos) {
  if (!CLIENT_TOOL_NAMES.has(name) || !args || typeof args !== 'object' || Array.isArray(args)) return false;
  if (name === 'create_task') {
    return hasExactKeys(args, ['text', 'priority', 'today', 'date'])
      && typeof args.text === 'string' && Boolean(args.text.trim()) && args.text.length <= 160
      && ['low', 'normal', 'high'].includes(args.priority) && typeof args.today === 'boolean'
      && (args.date === null || isValidTodoDate(args.date));
  }
  if (name === 'update_task') {
    const validText = args.text === null
      || (typeof args.text === 'string' && Boolean(args.text.trim()) && args.text.length <= 160);
    const validPriority = args.priority === null || ['low', 'normal', 'high'].includes(args.priority);
    const validToday = args.today === null || typeof args.today === 'boolean';
    const validDate = args.date_action === 'set' ? isValidTodoDate(args.date)
      : ['keep', 'clear'].includes(args.date_action) ? args.date === null : false;
    return hasExactKeys(args, ['id', 'text', 'priority', 'today', 'date_action', 'date'])
      && typeof args.id === 'string' && currentTodos.some((todo) => todo.id === args.id)
      && validText && validPriority && validToday && validDate
      && (args.text !== null || args.priority !== null || args.today !== null || args.date_action !== 'keep');
  }
  if (name === 'complete_task' || name === 'delete_task') {
    return hasExactKeys(args, ['id']) && typeof args.id === 'string'
      && currentTodos.some((todo) => todo.id === args.id);
  }
  return hasExactKeys(args, []);
}

function toolResult(status, currentTodos, message, task, tasks) {
  return {
    status,
    message,
    ...(task ? { task } : {}),
    ...(tasks ? { tasks } : {}),
    todos: getTodoContext(currentTodos),
  };
}

function saveToolChanges(nextTodos, status, message, task) {
  if (!saveTodos(nextTodos)) {
    return toolResult('storage_error', todos, '브라우저 저장소에 기록하지 못했어요. Todo는 변경되지 않았습니다.');
  }
  todos = nextTodos;
  renderTodos();
  const savedTask = task ? todos.find((todo) => todo.id === task.id) : undefined;
  return toolResult(status, todos, message, savedTask);
}

function confirmTodoDeletion(task, priorityLabel, todayLabel, dateLabel) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'todo-confirm-dialog';
    dialog.setAttribute('aria-labelledby', 'todo-confirm-title');

    const title = document.createElement('h2');
    title.id = 'todo-confirm-title';
    title.textContent = 'Todo를 삭제할까요?';

    const taskText = document.createElement('p');
    taskText.className = 'todo-confirm-text';
    taskText.textContent = task.text;

    const details = document.createElement('p');
    details.className = 'todo-confirm-details';
    details.textContent = `중요도: ${priorityLabel} · ${todayLabel} · ${dateLabel}`;

    const actions = document.createElement('div');
    actions.className = 'todo-confirm-actions';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'todo-confirm-cancel';
    cancelButton.textContent = '취소';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'todo-confirm-delete';
    deleteButton.textContent = '삭제';

    actions.append(cancelButton, deleteButton);
    dialog.append(title, taskText, details, actions);
    document.body.append(dialog);

    const finish = (confirmed) => {
      dialog.close();
      dialog.remove();
      resolve(confirmed);
    };
    cancelButton.addEventListener('click', () => finish(false));
    deleteButton.addEventListener('click', () => finish(true));
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish(false);
    });
    dialog.showModal();
    cancelButton.focus();
  });
}

async function executeTodoTool(call) {
  if (!call || typeof call.callId !== 'string' || !CLIENT_TOOL_NAMES.has(call.name)) {
    return { status: 'invalid_arguments', message: '허용되지 않은 도구 호출입니다.', todos: getTodoContext() };
  }

  const currentTodos = readLatestTodos();
  if (!currentTodos) {
    return { status: 'storage_error', message: '현재 Todo 저장소를 읽을 수 없어 변경하지 않았습니다.', todos: getTodoContext() };
  }
  todos = currentTodos;

  if (call.serverError === 'task_not_found') {
    return toolResult('task_not_found', currentTodos, '해당 ID의 Todo가 현재 목록에 없습니다.');
  }
  if (call.serverError || !validateClientArguments(call.name, call.arguments, currentTodos)) {
    return toolResult('invalid_arguments', currentTodos, '도구 인자 검증에 실패해 변경하지 않았습니다.');
  }

  const args = call.arguments;
  if (call.name === 'list_tasks') {
    return toolResult('success', currentTodos, '현재 Todo 목록입니다.', undefined, getTodoContext(currentTodos));
  }

  if (call.name === 'create_task') {
    const task = {
      id: crypto.randomUUID(),
      text: args.text.trim(),
      completed: false,
      priority: args.priority,
      today: args.today,
      ...(args.date ? { date: args.date } : {}),
    };
    return saveToolChanges([task, ...currentTodos], 'success', 'Todo를 추가했습니다.', task);
  }

  const task = currentTodos.find((todo) => todo.id === args.id);
  if (!task) return toolResult('task_not_found', currentTodos, '해당 ID의 Todo가 현재 목록에 없습니다.');

  if (call.name === 'update_task') {
    const updatedTask = { ...task };
    if (args.text !== null) updatedTask.text = args.text.trim();
    if (args.priority !== null) updatedTask.priority = args.priority;
    if (args.today !== null) updatedTask.today = args.today;
    if (args.date_action === 'set') updatedTask.date = args.date;
    if (args.date_action === 'clear') delete updatedTask.date;
    const nextTodos = currentTodos.map((todo) => todo.id === task.id ? updatedTask : todo);
    return saveToolChanges(nextTodos, 'success', 'Todo를 수정했습니다.', updatedTask);
  }

  if (call.name === 'complete_task') {
    if (task.completed) return toolResult('already_completed', currentTodos, '이미 완료된 Todo입니다.', task);
    const updatedTask = { ...task, completed: true };
    const nextTodos = currentTodos.map((todo) => todo.id === task.id ? updatedTask : todo);
    return saveToolChanges(nextTodos, 'success', 'Todo를 완료 처리했습니다.', updatedTask);
  }

  const priorityLabel = { low: '낮음', normal: '보통', high: '높음' }[task.priority] || '보통';
  const todayLabel = task.today ? '오늘 할 일' : '나중에 할 일';
  const dateLabel = task.date ? `예정일: ${task.date}` : '예정일 없음';
  const confirmed = await confirmTodoDeletion(task, priorityLabel, todayLabel, dateLabel);
  if (!confirmed) return toolResult('cancelled', currentTodos, '사용자가 삭제를 취소했습니다.', task);
  const nextTodos = currentTodos.filter((todo) => todo.id !== task.id);
  return saveToolChanges(nextTodos, 'success', 'Todo를 삭제했습니다.');
}

async function readJsonResponse(response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '요청을 처리하지 못했어요.');
  return result;
}

async function handleChatResponse(result, toolCount = 0) {
  if (result.type === 'message') {
    addChatMessage('assistant', result.reply);
    chatStatus.textContent = '';
    return;
  }
  if (result.type !== 'tool_calls' || !Array.isArray(result.calls) || !result.turnId) {
    throw new Error('서버 응답 형식이 올바르지 않아요.');
  }
  if (toolCount + result.calls.length > 5) {
    addChatMessage('assistant', '한 번의 요청에서 처리할 수 있는 작업은 최대 5개예요. 추가 작업은 실행하지 않았어요.');
    chatStatus.textContent = '';
    return;
  }

  const outputs = [];
  for (const call of result.calls) {
    toolCount += 1;
    chatStatus.textContent = `Todo 작업을 처리하고 있어요 (${toolCount}/5)…`;
    const toolOutput = await executeTodoTool(call);
    outputs.push({ callId: call.callId, result: toolOutput });
  }

  chatStatus.textContent = '변경 결과를 확인하고 있어요…';
  const response = await fetch('/api/chat/continue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      turnId: result.turnId,
      outputs,
      todos: getTodoContext(),
    }),
  });
  const nextResult = await readJsonResponse(response);
  return handleChatResponse(nextResult, toolCount);
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
      body: JSON.stringify({ message, todos: getTodoContext() }),
    });
    await handleChatResponse(await readJsonResponse(response));
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

const documentUploadForm = document.querySelector('#document-upload-form');
const documentFileInput = document.querySelector('#document-file');
const documentUploadButton = document.querySelector('#document-upload-button');
const documentStatus = document.querySelector('#document-status');
const documentList = document.querySelector('#document-list');
const documentEmpty = document.querySelector('#document-empty');

function renderDocuments(documents) {
  documentList.replaceChildren();
  for (const item of documents) {
    const row = document.createElement('li');
    row.className = 'document-item';

    const details = document.createElement('div');
    details.className = 'document-item-details';

    const name = document.createElement('span');
    name.className = 'document-name';
    name.textContent = item.filename;

    const count = document.createElement('span');
    count.className = 'document-chunk-count';
    count.textContent = `chunk ${item.chunkCount}개`;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'document-delete-button';
    deleteButton.textContent = '삭제';
    deleteButton.setAttribute('aria-label', `${item.filename} 문서 삭제`);
    deleteButton.addEventListener('click', () => deleteDocument(item));

    details.append(name, count);
    row.append(details, deleteButton);
    documentList.append(row);
  }
  documentEmpty.hidden = documents.length > 0;
}

async function loadDocuments() {
  try {
    const response = await fetch('/api/documents');
    renderDocuments(await readJsonResponse(response));
  } catch (error) {
    documentStatus.textContent = error.message || '문서 목록을 불러오지 못했어요.';
  }
}

documentUploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = documentFileInput.files[0];
  if (!file || documentUploadButton.disabled) return;

  documentUploadButton.disabled = true;
  documentStatus.textContent = '문서를 읽고 업로드하고 있어요…';
  try {
    let content;
    try {
      content = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    } catch {
      throw new Error('올바른 UTF-8 텍스트 파일만 업로드할 수 있어요.');
    }
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, content }),
    });
    const saved = await readJsonResponse(response);
    await loadDocuments();
    documentStatus.textContent = saved.duplicate
      ? `${saved.filename} 문서는 이미 등록되어 있어 기존 항목을 유지했어요.`
      : `${saved.filename} 업로드 완료 · chunk ${saved.chunkCount}개`;
    documentUploadForm.reset();
  } catch (error) {
    documentStatus.textContent = error instanceof TypeError
      ? '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.'
      : error.message || '문서를 업로드하지 못했어요.';
  } finally {
    documentUploadButton.disabled = false;
  }
});

async function deleteDocument(item) {
  const confirmed = await confirmDocumentDeletion(item.filename);
  if (!confirmed) return;
  documentStatus.textContent = `${item.filename} 문서를 삭제하고 있어요…`;
  try {
    const response = await fetch(`/api/documents/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || '문서를 삭제하지 못했어요.');
    }
    await loadDocuments();
    documentStatus.textContent = `${item.filename} 문서를 삭제했어요.`;
  } catch (error) {
    documentStatus.textContent = error instanceof TypeError
      ? '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.'
      : error.message || '문서를 삭제하지 못했어요.';
  }
}

function confirmDocumentDeletion(filename) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'document-confirm-dialog';
    dialog.setAttribute('aria-labelledby', 'document-confirm-title');

    const title = document.createElement('h2');
    title.id = 'document-confirm-title';
    title.textContent = '문서를 삭제할까요?';

    const message = document.createElement('p');
    message.textContent = filename;

    const actions = document.createElement('div');
    actions.className = 'document-confirm-actions';
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'document-confirm-cancel';
    cancelButton.textContent = '취소';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'document-confirm-delete';
    deleteButton.textContent = '삭제';
    actions.append(cancelButton, deleteButton);
    dialog.append(title, message, actions);
    document.body.append(dialog);

    const finish = (confirmed) => {
      dialog.close();
      dialog.remove();
      resolve(confirmed);
    };
    cancelButton.addEventListener('click', () => finish(false));
    deleteButton.addEventListener('click', () => finish(true));
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish(false);
    });
    dialog.showModal();
    cancelButton.focus();
  });
}

loadDocuments();

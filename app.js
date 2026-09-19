const STORAGE_KEY = "focuslist.tasks.v1";
const THEME_KEY = "focuslist.theme.v1";

const state = {
  tasks: loadTasks(),
  filter: "all",
};

const elements = {
  form: document.querySelector("#todo-form"),
  input: document.querySelector("#todo-input"),
  dueDateInput: document.querySelector("#due-date-input"),
  list: document.querySelector("#task-list"),
  template: document.querySelector("#task-template"),
  filterButtons: [...document.querySelectorAll(".filter-button")],
  clearCompleted: document.querySelector("#clear-completed"),
  emptyState: document.querySelector("#empty-state"),
  emptyTitle: document.querySelector("#empty-title"),
  emptyDescription: document.querySelector("#empty-description"),
  totalCount: document.querySelector("#total-count"),
  activeCount: document.querySelector("#active-count"),
  completedCount: document.querySelector("#completed-count"),
  footerActiveCount: document.querySelector("#footer-active-count"),
  todayLabel: document.querySelector("#today-label"),
  themeToggle: document.querySelector("#theme-toggle"),
  themeIcon: document.querySelector(".theme-icon"),
};

initialize();

function initialize() {
  setTodayLabel();
  initializeTheme();
  bindEvents();
  render();
}

function bindEvents() {
  elements.form.addEventListener("submit", handleAddTask);
  elements.clearCompleted.addEventListener("click", clearCompletedTasks);

  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;

      elements.filterButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });

      render();
    });
  });

  elements.themeToggle.addEventListener("click", toggleTheme);
}

function handleAddTask(event) {
  event.preventDefault();

  const title = normalizeTitle(elements.input.value);
  if (!title) return;

  state.tasks.unshift({
    id: createId(),
    title,
    dueDate: normalizeDueDate(elements.dueDateInput.value),
    completed: false,
    createdAt: new Date().toISOString(),
  });

  saveTasks();
  elements.form.reset();
  render();
  elements.input.focus();
}

function toggleTask(id) {
  state.tasks = state.tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );

  saveTasks();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

function clearCompletedTasks() {
  if (!state.tasks.some((task) => task.completed)) return;

  state.tasks = state.tasks.filter((task) => !task.completed);
  saveTasks();
  render();
}

function startEditing(task, item) {
  if (item.querySelector(".task-edit-fields")) return;

  const content = item.querySelector(".task-content");
  const fields = document.createElement("div");
  fields.className = "task-edit-fields";

  const titleInput = document.createElement("input");
  titleInput.className = "task-edit-input";
  titleInput.type = "text";
  titleInput.maxLength = 120;
  titleInput.value = task.title;
  titleInput.setAttribute("aria-label", "编辑任务内容");

  const dueInput = document.createElement("input");
  dueInput.className = "task-edit-date";
  dueInput.type = "date";
  dueInput.value = task.dueDate || "";
  dueInput.setAttribute("aria-label", "编辑截止日期");

  const buttons = document.createElement("div");
  buttons.className = "task-edit-buttons";

  const saveButton = document.createElement("button");
  saveButton.className = "edit-save-button";
  saveButton.type = "button";
  saveButton.textContent = "保存";

  const cancelButton = document.createElement("button");
  cancelButton.className = "edit-cancel-button";
  cancelButton.type = "button";
  cancelButton.textContent = "取消";

  buttons.append(saveButton, cancelButton);
  fields.append(titleInput, dueInput, buttons);
  content.replaceChildren(fields);

  titleInput.focus();
  titleInput.select();

  const finishEditing = (shouldSave) => {
    if (!fields.isConnected) return;

    if (shouldSave) {
      const nextTitle = normalizeTitle(titleInput.value);
      if (!nextTitle) {
        titleInput.focus();
        return;
      }

      state.tasks = state.tasks.map((candidate) =>
        candidate.id === task.id
          ? {
              ...candidate,
              title: nextTitle,
              dueDate: normalizeDueDate(dueInput.value),
            }
          : candidate
      );
      saveTasks();
    }

    render();
  };

  saveButton.addEventListener("click", () => finishEditing(true));
  cancelButton.addEventListener("click", () => finishEditing(false));

  fields.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      finishEditing(false);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      finishEditing(true);
    }
  });
}

function render() {
  const visibleTasks = getVisibleTasks();

  elements.list.replaceChildren();

  visibleTasks.forEach((task) => {
    const item = elements.template.content.firstElementChild.cloneNode(true);
    const checkbox = item.querySelector(".task-checkbox");
    const taskText = item.querySelector(".task-text");
    const taskMeta = item.querySelector(".task-meta");
    const editButton = item.querySelector(".edit-task");
    const deleteButton = item.querySelector(".delete-task");

    item.dataset.id = task.id;
    item.classList.toggle("is-completed", task.completed);

    const dueStatus = getDueStatus(task);
    item.classList.toggle("is-overdue", dueStatus === "overdue");
    item.classList.toggle("is-due-today", dueStatus === "today");

    checkbox.checked = task.completed;
    checkbox.setAttribute(
      "aria-label",
      task.completed ? `将“${task.title}”标记为未完成` : `将“${task.title}”标记为完成`
    );

    taskText.textContent = task.title;
    renderTaskMeta(task, taskMeta);

    checkbox.addEventListener("change", () => toggleTask(task.id));
    deleteButton.addEventListener("click", () => deleteTask(task.id));
    editButton.addEventListener("click", () => startEditing(task, item));
    taskText.addEventListener("dblclick", () => startEditing(task, item));

    elements.list.appendChild(item);
  });

  renderStats();
  renderEmptyState(visibleTasks);
}

function renderStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((task) => task.completed).length;
  const active = total - completed;

  elements.totalCount.textContent = total;
  elements.activeCount.textContent = active;
  elements.completedCount.textContent = completed;
  elements.footerActiveCount.textContent = active;
  elements.clearCompleted.disabled = completed === 0;
}

function renderEmptyState(visibleTasks) {
  const isEmpty = visibleTasks.length === 0;
  elements.emptyState.hidden = !isEmpty;

  if (!isEmpty) return;

  if (state.tasks.length === 0) {
    elements.emptyTitle.textContent = "还没有待办事项";
    elements.emptyDescription.textContent = "从上方添加第一项任务，开始清空你的待办清单。";
    return;
  }

  if (state.filter === "active") {
    elements.emptyTitle.textContent = "待办已全部完成";
    elements.emptyDescription.textContent = "做得不错。这里已经没有未完成的任务。";
    return;
  }

  elements.emptyTitle.textContent = "暂无已完成任务";
  elements.emptyDescription.textContent = "完成的任务会自动出现在这里。";
}

function getVisibleTasks() {
  if (state.filter === "active") {
    return state.tasks.filter((task) => !task.completed);
  }

  if (state.filter === "completed") {
    return state.tasks.filter((task) => task.completed);
  }

  return state.tasks;
}

function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];

    return stored
      .filter(
        (task) =>
          task &&
          typeof task.id === "string" &&
          typeof task.title === "string" &&
          typeof task.completed === "boolean"
      )
      .map((task) => ({
        ...task,
        dueDate: normalizeDueDate(task.dueDate),
      }));
  } catch {
    return [];
  }
}

function renderTaskMeta(task, taskMeta) {
  const created = document.createElement("span");
  created.textContent = formatCreatedAt(task.createdAt);
  taskMeta.replaceChildren(created);

  if (!task.dueDate) return;

  const due = document.createElement("span");
  due.className = "due-date";
  due.textContent = formatDueDate(task.dueDate, getDueStatus(task));
  taskMeta.appendChild(due);
}

function getDueStatus(task) {
  if (!task.dueDate) return "none";
  if (task.completed) return "completed";

  const today = getTodayKey();

  if (task.dueDate < today) return "overdue";
  if (task.dueDate === today) return "today";
  return "upcoming";
}

function formatDueDate(value, status) {
  const parts = value.split("-");
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (status === "today") return "今天截止";
  if (status === "overdue") return `已逾期 · ${month}月${day}日`;
  return `${month}月${day}日截止`;
}

function getTodayKey() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function normalizeDueDate(value) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTitle(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 120);
}

function formatCreatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "已保存";

  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    return `今天 ${new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)} 添加`;
  }

  return `${new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(date)} 添加`;
}

function setTodayLabel() {
  const dateText = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  elements.todayLabel.textContent = `${dateText} · 把重要的事情一件件完成。`;
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const systemPrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (systemPrefersDark ? "dark" : "light");

  applyTheme(theme);
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || "light";
  const next = current === "dark" ? "light" : "dark";

  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";

  elements.themeIcon.textContent = isDark ? "☀" : "☾";
  elements.themeToggle.setAttribute("aria-label", isDark ? "切换浅色模式" : "切换深色模式");
  elements.themeToggle.setAttribute("title", isDark ? "切换浅色模式" : "切换深色模式");
}
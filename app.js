const STORAGE_KEY = "taskManager.tasks.v1";

const priorityWeight = { high: 0, medium: 1, low: 2 };

const state = {
  tasks: loadTasks(),
  search: "",
  statusFilter: "all",
  sortBy: "priority",
  sortDirection: "asc"
};

const els = {
  taskForm: document.getElementById("taskForm"),
  title: document.getElementById("title"),
  description: document.getElementById("description"),
  priority: document.getElementById("priority"),
  dueDate: document.getElementById("dueDate"),
  category: document.getElementById("category"),
  estimate: document.getElementById("estimate"),
  search: document.getElementById("search"),
  statusFilter: document.getElementById("statusFilter"),
  sortBy: document.getElementById("sortBy"),
  sortDirection: document.getElementById("sortDirection"),
  clearCompleted: document.getElementById("clearCompleted"),
  summary: document.getElementById("summary"),
  taskList: document.getElementById("taskList"),
  itemTemplate: document.getElementById("taskItemTemplate")
};

bindEvents();
render();

function bindEvents() {
  els.taskForm.addEventListener("submit", onTaskSubmit);
  els.search.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });
  els.statusFilter.addEventListener("change", (event) => {
    state.statusFilter = event.target.value;
    render();
  });
  els.sortBy.addEventListener("change", (event) => {
    state.sortBy = event.target.value;
    render();
  });
  els.sortDirection.addEventListener("change", (event) => {
    state.sortDirection = event.target.value;
    render();
  });
  els.clearCompleted.addEventListener("click", () => {
    state.tasks = state.tasks.filter((task) => !task.completed);
    saveTasks(state.tasks);
    render();
  });
}

function onTaskSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const id = event.target.dataset.editingId;

  const task = {
    id: id || crypto.randomUUID(),
    title: formData.get("title").trim(),
    description: formData.get("description").trim(),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    category: formData.get("category").trim(),
    estimate: formData.get("estimate"),
    completed: false,
    createdAt: new Date().toISOString()
  };

  if (!task.title) {
    return;
  }

  if (id) {
    const existing = state.tasks.find((entry) => entry.id === id);
    task.completed = existing.completed;
    task.createdAt = existing.createdAt;
    state.tasks = state.tasks.map((entry) => (entry.id === id ? task : entry));
    delete event.target.dataset.editingId;
  } else {
    state.tasks.push(task);
  }

  saveTasks(state.tasks);
  event.target.reset();
  els.priority.value = "medium";
  render();
}

function render() {
  const visibleTasks = filterAndSortTasks(state.tasks);
  renderSummary(state.tasks, visibleTasks);
  renderTasks(visibleTasks);
}

function renderSummary(allTasks, visibleTasks) {
  const total = allTasks.length;
  const completed = allTasks.filter((task) => task.completed).length;
  const overdue = allTasks.filter((task) => isOverdue(task)).length;
  const active = total - completed;
  const totalEstimate = allTasks.reduce((sum, task) => sum + Number(task.estimate || 0), 0);

  els.summary.innerHTML = `
    <span>Total: <strong>${total}</strong></span>
    <span>Active: <strong>${active}</strong></span>
    <span>Completed: <strong>${completed}</strong></span>
    <span>Overdue: <strong>${overdue}</strong></span>
    <span>Visible: <strong>${visibleTasks.length}</strong></span>
    <span>Est. Hours: <strong>${totalEstimate.toFixed(1)}</strong></span>
  `;
}

function renderTasks(tasks) {
  els.taskList.innerHTML = "";

  if (!tasks.length) {
    const empty = document.createElement("li");
    empty.className = "task-item";
    empty.textContent = "No tasks match your filters.";
    els.taskList.append(empty);
    return;
  }

  tasks.forEach((task) => {
    const fragment = els.itemTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".task-item");
    const badge = fragment.querySelector(".badge");

    fragment.querySelector(".task-title").textContent = task.title;
    fragment.querySelector(".task-description").textContent = task.description || "No description";
    fragment.querySelector(".task-meta").textContent = buildMeta(task);

    badge.textContent = task.priority.toUpperCase();
    badge.classList.add(task.priority);

    if (task.completed) {
      item.classList.add("completed");
    }
    if (isOverdue(task)) {
      item.classList.add("overdue");
    }

    const toggleButton = fragment.querySelector(".toggle-complete");
    toggleButton.textContent = task.completed ? "Mark Active" : "Mark Completed";
    toggleButton.addEventListener("click", () => toggleTask(task.id));
    fragment.querySelector(".edit").addEventListener("click", () => editTask(task.id));
    fragment.querySelector(".delete").addEventListener("click", () => deleteTask(task.id));

    els.taskList.append(fragment);
  });
}

function filterAndSortTasks(tasks) {
  const filtered = tasks.filter((task) => {
    const haystack = `${task.title} ${task.description} ${task.category}`.toLowerCase();
    const matchesSearch = haystack.includes(state.search);
    const matchesStatus =
      state.statusFilter === "all" ||
      (state.statusFilter === "active" && !task.completed) ||
      (state.statusFilter === "completed" && task.completed) ||
      (state.statusFilter === "overdue" && isOverdue(task));
    return matchesSearch && matchesStatus;
  });

  return filtered.sort((a, b) => {
    let comparison = 0;
    switch (state.sortBy) {
      case "priority":
        comparison = priorityWeight[a.priority] - priorityWeight[b.priority];
        break;
      case "dueDate":
        comparison = getDateNumber(a.dueDate) - getDateNumber(b.dueDate);
        break;
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      default:
        comparison = getDateNumber(a.createdAt) - getDateNumber(b.createdAt);
    }

    return state.sortDirection === "asc" ? comparison : -comparison;
  });
}

function buildMeta(task) {
  const dueText = task.dueDate ? `Due ${task.dueDate}` : "No due date";
  const categoryText = task.category ? `Category: ${task.category}` : "No category";
  const estimateText = task.estimate ? `Est: ${task.estimate}h` : "No estimate";
  return `${dueText} • ${categoryText} • ${estimateText}`;
}

function toggleTask(taskId) {
  state.tasks = state.tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  saveTasks(state.tasks);
  render();
}

function editTask(taskId) {
  const task = state.tasks.find((entry) => entry.id === taskId);
  if (!task) return;

  els.title.value = task.title;
  els.description.value = task.description;
  els.priority.value = task.priority;
  els.dueDate.value = task.dueDate;
  els.category.value = task.category;
  els.estimate.value = task.estimate;
  els.taskForm.dataset.editingId = task.id;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  saveTasks(state.tasks);
  render();
}

function getDateNumber(input) {
  if (!input) {
    return Number.MAX_SAFE_INTEGER;
  }
  const value = Date.parse(input);
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  return Date.parse(task.dueDate) < new Date().setHours(0, 0, 0, 0);
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

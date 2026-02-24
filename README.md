# TaskManager

A lightweight browser-based task manager focused on prioritization and scheduling.

## Features
- Create tasks with title, description, priority (high/medium/low), due date, category, and estimated effort.
- Sort tasks by priority, due date, creation date, or title in ascending/descending order.
- Search and filter tasks by status (all, active, completed, overdue).
- Mark tasks complete/incomplete, edit tasks, delete tasks, and bulk-clear completed tasks.
- Dashboard summary with total, active, completed, overdue, visible task count, and total estimated hours.
- Local persistence using `localStorage`.

## Run locally
Because this is a static web app, you can run it with a simple file server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

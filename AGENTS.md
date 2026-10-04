# Project Development Rules

## Project overview

- This is a small Korean-language to-do web app.
- The current project consists of `index.html`, `style.css`, and `app.js`.
- Keep the project structure small and easy to understand. Do not add unnecessary directories, abstractions, dependencies, or tooling.

## Technology and dependencies

- Use semantic HTML, CSS, and plain JavaScript.
- Do not add a framework, package manager, build tool, or runtime dependency unless the user explicitly asks for it and the need is explained first.
- The app is served as static files; keep it usable without a compilation or bundling step.
- Google Fonts are currently loaded by CSS. Do not make core functionality depend on an external font or network request.

## Existing behavior and data

- Preserve the existing browser `localStorage` persistence and the key `one-step-todos-v1`.
- Do not clear, rename, or replace the current storage key or discard saved tasks as part of a feature change.
- Existing tasks may use the older shape `{ id, text, completed }`. Keep them readable and supply safe defaults for missing fields: `priority: 'normal'` and `today: true`.
- Valid importance values are `low`, `normal`, and `high`. Keep unknown or missing values safe by falling back to `normal`.
- Keep task IDs and text intact when loading existing data. Validate stored data defensively and handle malformed JSON or unavailable browser storage without crashing the page.
- Persist task changes after adding, completing, or deleting a task. Keep completion state, importance, and today status consistent across reloads.
- Existing tasks can be filtered by all, today, incomplete, completed, and high importance. Keep the remaining-task count based on all incomplete tasks, not only the currently visible filter results.
- A newly added task defaults to normal importance and is marked as a task for today. Reset the entry controls to those defaults after adding.

## UI, accessibility, and responsive behavior

- Preserve the current visual style and familiar interaction patterns unless the user asks for a redesign.
- Keep the layout comfortable on mobile widths, including the input row, importance selector, today checkbox, filters, and task metadata. The existing mobile breakpoint is 520px; check it when changing layout rules.
- Use semantic controls and meaningful accessible labels for inputs, completion checkboxes, delete buttons, and filters. Retain visible keyboard focus styles and live announcements where appropriate.
- Keep completed tasks visually distinct and retain the visual emphasis for high-importance tasks and lower emphasis for tasks not marked for today.
- Render user-entered task text as text, not executable HTML. Do not interpolate task content into `innerHTML`.

## Change workflow

- Before editing, briefly explain the planned files and implementation approach.
- Before changing or removing existing functionality, establish why the change is needed and preserve unrelated behavior.
- Prefer focused edits to the existing three files. Add a new file only when it has a clear purpose.
- After adding or changing behavior, run the app in a real browser and exercise the affected flows. At minimum, verify task creation, relevant controls and filters, completion, deletion, and persistence after reload; verify existing saved data remains usable when storage behavior or data shape changes.
- Check responsive behavior at desktop and mobile widths when UI layout changes.
- Check JavaScript syntax and inspect the browser console for errors after browser testing.
- Do not add a test framework or build infrastructure solely for a small change without first explaining the need.
- After work, summarize changed files, the behavior changed, and the tests performed and their results.

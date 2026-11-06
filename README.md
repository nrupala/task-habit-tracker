# Task & Habit Tracker

A standalone, single-file task and habit tracker with streaks, priority recommendations, performance reports, and passphrase-encrypted backups — no server, no account, no setup.

Open `index.html` and you get the whole app: add tasks with due dates, notes, tags, and time estimates; mark habits done each day to build streaks shown on a heatmap calendar; let the recommendation list order your pending work (habits first, then overdue items, due-soon items, and quick wins); review 7-day performance and export it as CSV; and back everything up as an AES-GCM-encrypted JSON file you can carry to another device (Google Drive, OneDrive, a USB stick) and decrypt there with the same passphrase. All data lives in your browser's `localStorage` on each device. The app is also served live via GitHub Pages: https://nrupala.github.io/task-habit-tracker

> Accuracy notes, from the code as shipped: (1) the tracker itself is fully local, but the CSV and encrypted exports call the FileSaver helper, which `index.html` loads from the cdnjs CDN (with an SRI integrity hash; `task-habit-tracker.html` loads it without one) — so the two export buttons need network access to that CDN, even though everything else works offline. (2) Completion timestamps are recorded when a habit is completed, and the 7-day report and the CSV export are built from those timestamps, so they count habit completions.

## What it does

- **Task management** — add, edit, and delete tasks with a due date, notes, comma-separated tags, and an estimated duration; completing a task defaults its actual time to the estimate, and you can log the real minutes afterwards.
- **Habit tracking** — habits keep a daily streak (completing on consecutive days extends it; a missed day resets it to 1) and fill a colour-coded heatmap calendar (light blue 1 habit, green 2, dark green 3+, ring for today).
- **Recommendations** — pending work is scored and the top 8 are listed: habit +40, habit not yet done today +15, streak bonus up to +10, overdue +30, due within a day +25 (then +20 / +10 within 3 / 7 days), quick win (≤15 minutes) +15.
- **Performance report** — tasks completed in the last 7 days with estimated-vs-actual minutes and the average habit streak; the underlying records also export to CSV in the format documented in [docs/api.md](docs/api.md).
- **Templates** — four built in (Daily Review, Code Sprint, Gym Weights, Portfolio Review), and you can save the current form as your own template from within the app; templates are stored locally, and the built-in set is the `BUILTIN_TEMPLATES` list in `index.html`.
- **Encrypted sync** — export encrypts the full state with a key derived from your passphrase (PBKDF2, 100,000 iterations, SHA-256) using AES-GCM-256 (Web Crypto), saved as `tasks-<date>.json.enc`; import on another device decrypts it with the same passphrase. There is no passphrase recovery.
- **Themes** — dark / light / system, remembered per device.
- **Two builds, one app** — `index.html` is the app GitHub Pages serves; `task-habit-tracker.html` is the same app as a standalone single file (they share the storage keys and logic).

## How to use it

1. Clone or download this repository (or open the live demo above).
2. Open `index.html` in any modern browser — double-clicking the file works.
3. Fill in the task form (title required) and save; use the checkbox to complete a task, **Edit** to change it, **Log min** to record actual time, **Del** to remove it.
4. Check the recommendation list for what to do next, and the calendar for your habit streaks.
5. Periodically: **Export CSV** for a spreadsheet record, and **Export Encrypted JSON** with a passphrase for backup or moving to another device; there, **Import & Decrypt** with the same passphrase restores everything.

The [user guide](docs/usage.md) covers the workflow, keyboard shortcuts (Ctrl+Enter saves, Esc clears the form), and the calendar legend; [docs/api.md](docs/api.md) documents the task object and the CSV export format.

## Development

- Run the tests: `node tests/smoke.test.js` (Node 18+, no dependencies — the suite loads the page's own script and exercises task add/edit/delete, completion and streak rules, the recommendation scoring, CSV export, and a full AES-GCM encrypt/decrypt round-trip of the backup format).
- CI runs the same suite on every push and pull request (`.github/workflows/tests.yml`), alongside the repository-structure check in `.github/workflows/ci.yml`.
- The test plan (scope, suites, gates, cadence) lives in [TEST-PLAN.md](TEST-PLAN.md).

## Security

Found a vulnerability? Please report it privately — see [SECURITY.md](SECURITY.md) for the reporting route (GitHub Private Vulnerability Reporting). Do not open a public issue for a security vulnerability.

## Contributing

Contributions are welcome — the process is in [CONTRIBUTING.md](CONTRIBUTING.md), and conduct is covered by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Note the PR-flow discipline there: changes land through draft pull requests with a CHANGELOG entry per PR. This repo declares no version in any file (see CONTRIBUTING); releases are tagged after merge when the maintainer sets a version.

## License

MIT — see [LICENSE](LICENSE).

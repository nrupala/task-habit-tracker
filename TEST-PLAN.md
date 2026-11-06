# Test plan — task-habit-tracker

## Scope

Testing covers the single-page app in `index.html` (task CRUD, completion and
habit-streak rules, recommendation scoring, habit history/report, templates,
CSV export, and the AES-GCM encrypted backup) — `task-habit-tracker.html` is
the same app and is checked for the shared storage key and core logic.
Rendering, styling, the browser file pickers behind import, and the FileSaver
CDN helper itself are out of scope for the automated suite and are checked
manually in a browser before a release. One observed behaviour is pinned by
the suite and flagged in the filing pack: completion timestamps are recorded
for habits, so the report and CSV export count habit completions.

## Suites

| Suite | Covers | Run it | Runs in CI |
|---|---|---|---|
| Smoke suite (`tests/smoke.test.js`) | Page structure (core element IDs; twin build shares storage key + core logic); task add via the real form handler (shape per docs/api.md, tag parsing, localStorage persistence, empty-title rejection); edit-in-place preserving status/streak; completion (status flip, actual-minutes default); streak rules (first completion = 1, same-day recompletion does not double-count, consecutive day extends, missed day resets); recommendation scoring against the documented weights in docs/usage.md (habit 40 + missed 15 + streak bonus, overdue 30, quick win 15; done tasks excluded; sorted); habit history + 7-day report render; builtin template set; CSV export (filename, docs/api.md header, habit row present, non-habit completion omission pinned); encrypted backup round-trip (export with a passphrase, decrypt the salt+IV+ciphertext layout with PBKDF2/AES-GCM back to the exact state; wrong passphrase fails); delete + persistence | `node tests/smoke.test.js` | Yes — `.github/workflows/tests.yml` |
| Repository structure check | Presence of `index.html`, `task-habit-tracker.html`, `README.md`, `LICENSE` | (shell steps in the workflow) | Yes — `.github/workflows/ci.yml` |

## CI gates

- Smoke suite green on every push and pull request to `main`.
- CodeQL (javascript-typescript) runs on push, pull request, and weekly; findings are dispositioned per the house SLA (Critical 48 h, High 7 d, Medium 14 d — fix, or a dismissal with the reason recorded).

## Cadence

- Every pull request: smoke suite + structure check + CodeQL.
- Weekly: CodeQL scheduled run.
- Every release candidate: the release-readiness run (checker + evidence reads), per the house Release-Readiness Standard.

## Coverage bar

No numeric floor; new functionality lands with tests per CONTRIBUTING.

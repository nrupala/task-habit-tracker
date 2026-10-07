# Contributing to task-habit-tracker

This repo ships by the **portfolio PR-flow discipline** — the per-update
certification. Direct pushes to `main` are retired. Every change goes:

**draft PR → tests green → owner merges**

## Process

1. Branch from `main` (`feature/<short-name>` or `fix/<short-name>`).
2. Open the PR as **DRAFT** while work is in flight; mark ready when done.
3. There is no test suite in this repo yet — verify by loading `index.html`
   (or `task-habit-tracker.html`, the full single-file build) in a browser
   and exercising the changed feature before marking ready.
4. **Each PR adds a `CHANGELOG.md` entry under `## [Unreleased]`** describing
   what changed (Added / Changed / Fixed).
5. This repo has no version file — none to bump (say so in the PR if it
   matters). Merge commits reference the PR number; releases are tagged
   `vX.Y.Z` after merge.
6. The owner merges. Deploy happens by serving/publishing `index.html`
   (GitHub Pages per README).

## Structure

- `index.html` — the app (single file; this is what GitHub Pages serves).
- `task-habit-tracker.html` — the full single-file build (same app).
- `docs/usage.md` — user guide; `docs/api.md` — data/CSV format;
  `docs/screenshots/` — screenshots.
- Code of Conduct: `CODE_OF_CONDUCT.md`.

## License

MIT — see `LICENSE`. Keep the SPDX header line on source files.

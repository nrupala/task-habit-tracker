# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Add the SRI integrity hash (matching index.html) to the FileSaver CDN
  script tag in task-habit-tracker.html, so the library is only executed
  when it matches the pinned digest (CodeQL js/functionality-from-untrusted-source).


### Added
- `CONTRIBUTING.md`: portfolio PR-flow discipline (draft PR → review → owner
  merges; no direct pushes to main; CHANGELOG entry per PR).
- `NOTICE.md`: attribution.
- `CHANGELOG.md` itself (this file).
- SPDX license headers (`MIT`) on `index.html` and
  `task-habit-tracker.html`.

# CONTRIBUTING.md

This is the canonical contribution contract for `quiz-crafter`.

## Live Source Of Truth

GitHub is the live source of truth for:
- Issues and milestones
- CI, workflow, and release runs
- Releases

If markdown in this repository conflicts with GitHub state, GitHub wins.

## Before You Edit

For non-trivial work:
1. Search for an existing GitHub issue.
2. Reuse it or create a new issue.
3. Ensure the issue has a milestone.
4. Use `Backlog` when no thematic milestone fits.
5. Create a branch before editing.

Canonical branch format:

```text
<actor>/<type>/<scope>/<task>-<id>
```

Do not implement non-trivial work directly on `main`.

## Canonical Prompt Vocabulary

- `start <task>`: issue + milestone + branch, then begin work
- `record it`: commit current changes
- `publish it`: push current branch
- `propose it`: open or update the PR
- `land it`: squash-merge the PR after checks and approval
- `ship it`: commit + push + PR
- `finish it`: commit + push + PR + merge
- `finish it for #<id>`: canonical full-flow shorthand tied to an issue

## Repository Map

- App source: `src/`
- Electron main process: `src/main/`
- Electron preload bridge: `src/preload/`
- React renderer: `src/renderer/`
- Development scripts: `scripts/`
- Documentation: `docs/`
- Reference material: `reference/`

## Engineering Constraints

- Keep the renderer process isolated from Node and filesystem/database access.
- Route privileged operations through preload IPC contracts (`src/shared/ipc.ts`).
- Enforce validation rules through shared validation/domain modules.
- Keep SQLite access and migration logic in the main process DB layer.

## Required Local Validation Before PR

```bash
npm run build
python .github/scripts/validate_contribution_guardrails.py
```

If a command cannot run locally, document the reason in the PR.

## Pull Request Expectations

- Link an issue.
- Confirm milestone usage (`Backlog` if needed).
- Keep scope aligned to the linked issue.
- Ensure required checks pass before merge.

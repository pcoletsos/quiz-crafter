# Quiz Crafter

Quiz Crafter is a local-first desktop app for creating, editing, and playing quizzes.
It is built with Electron, React, TypeScript, and SQLite.

## Contribution Workflow

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before making changes.

For non-trivial work:
1. Use or create a GitHub issue.
2. Ensure the issue has a milestone (`Backlog` when no themed milestone fits).
3. Create a branch with the canonical format from `CONTRIBUTING.md`.
4. Open a pull request using the PR template.

## Local Development

```bash
npm install
npm run dev
```

## Local Validation

```bash
npm run build
python .github/scripts/validate_contribution_guardrails.py
```

## Source Of Truth

GitHub is the live source of truth for:
- Issues and milestones
- CI and release runs
- Releases

If repository markdown and GitHub diverge, GitHub wins.

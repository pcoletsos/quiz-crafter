# AGENTS.md

This is a thin adapter for agent workflows in `quiz-crafter`.

1. Read `CONTRIBUTING.md` first.
2. Follow branch, issue, milestone, and validation policy exactly.
3. Treat GitHub as the live source of truth when markdown drifts.

## Agent execution protocol

Agent-managed issues on the owner-scope GitHub Project #3 ("Portfolio Workspace and
Site Readiness") follow the shared **agent execution protocol**: the `Agent State`
lifecycle (`Agent Todo → Agent Working → Agent Needs Input | Agent Review | Agent Done`),
idempotent receipt comments (`AGENT CLAIMED` / `AGENT BLOCKED` / `AGENT DONE`), and the
`needs-input` hard stop. Drive state with the receipt scripts, not ad-hoc project edits.

Canonical spec and tooling live in `koletsos-portfolio`:
- Protocol: https://github.com/pcoletsos/koletsos-portfolio/blob/main/docs/agent-execution-protocol.md
- Scripts: https://github.com/pcoletsos/koletsos-portfolio/tree/main/scripts
  (`github-agent-receipt.ps1`, `github-agent-needs-input.ps1`, `github-agent-queue.ps1`)

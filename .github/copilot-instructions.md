# Copilot Instructions

Follow `CONTRIBUTING.md` as the canonical contribution policy.

Repository specifics:
- Keep privileged logic in `src/main/` and expose only safe IPC through preload/shared contracts.
- Keep renderer changes in `src/renderer/` and avoid direct Node/DB usage there.
- Prefer small, issue-scoped pull requests with linked milestones.

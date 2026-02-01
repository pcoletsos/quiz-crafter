# Architecture and Tech Decisions

## Decision 1: Electron vs Tauri
**Choice**
- Electron (default for MVP)

**Rationale**
- Fastest path to a stable cross-platform desktop app
- Large ecosystem and documentation
- Straightforward packaging via electron-builder

**Tradeoffs**
- Larger binary size compared to Tauri
- Higher memory usage

**Alternative**
- Tauri for smaller binaries and tighter system integration, with more setup cost

## Decision 2: SQLite vs JSON files
**Choice**
- SQLite for local persistence

**Rationale**
- Reliable transactions and integrity
- Scales better as quiz count grows
- Familiar tooling for migrations and queries

**Tradeoffs**
- More setup complexity than flat files

## Decision 3: ID Format
**Choice**
- UUID for quizzes, questions, and options

**Rationale**
- Simple, local-first unique IDs
- Easy to generate across processes

## Decision 4: Content Limits and Option Counts
**Choice**
- Quiz title max 200 chars
- Question max 1200 chars
- Option max 500 chars
- 2 to 5 options per question

**Rationale**
- Limits derived from the sample PDF analysis with headroom
- Keeps UI readable while allowing long-form content

## Decision 5: MVP UX Choices
**Choice**
- Results include per-question review
- Reorder questions via up/down buttons in MVP (drag-and-drop later)
- Delete uses confirmation plus undo toast
- Manual save only in MVP

**Rationale**
- Clear, low-risk interactions for the first release
- Drag-and-drop and autosave can be added later

## Security Posture (Electron)
- Context isolation enabled
- Node integration disabled in renderer
- IPC whitelist and strict payload validation
- All file and DB access in main process only

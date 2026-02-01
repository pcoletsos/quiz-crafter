# Quiz Crafter Implementation Plan

## 1. Overview
This app is a local, cross-platform desktop tool for creating and playing quizzes. Users can build quizzes with multiple questions, each question having multiple options and exactly one correct answer, then play the quiz in a simple, guided flow. All data is stored locally on the device.

**MVP scope**
- Local quiz creation, editing, and play
- Persistent storage across restarts
- Exactly one correct option per question

**Explicit non-goals (MVP)**
- No accounts or authentication
- No cloud sync or sharing
- No online multiplayer or leaderboards
- No external content import/export (post-MVP)

## 2. Recommended Cross-Platform Tech Stack
**Recommended default**
- Electron + React + TypeScript + SQLite + electron-builder

**Why this stack**
- Fast to prototype with stable tooling
- Mature desktop ecosystem and packaging
- SQLite is reliable and local-first

**Alternative (optional)**
- Tauri + React or Vue + SQLite
  - Smaller app size, but more setup complexity

## 3. High-Level Architecture
**Process split**
- Renderer (React UI)
  - Screens, forms, navigation, and state
  - Calls safe APIs only, no direct file/DB access
- Main process (Electron)
  - Database access, file system, migrations
  - Validates and enforces integrity rules

**IPC boundary**
- Renderer calls whitelisted APIs only
- Validate all inputs at the boundary
- Return structured errors for UI display

**Layers**
- UI -> Application/Domain -> Persistence
- Domain layer holds validation rules
- Persistence handles SQLite read/write and transactions

**Security basics**
- Context isolation enabled
- Node integration disabled in renderer
- Strict IPC contract with validation

## 4. Key Features and User Flows (MVP)
**Quiz management**
- Create, list, open, rename, delete quizzes

**Question management**
- Add, edit, delete, reorder questions
- Add/remove answer options

**Correct answer selection**
- Radio button selection per question
- Exactly one correct option is required

**Quiz play/preview**
- One question at a time
- Progress indicator (e.g., 3 of 10)
- Results summary at the end
- Per-question review (show selected vs correct)

**Validation rules**
- Quiz title required, max 200 chars
- Question text required, max 1200 chars
- Option text required, max 500 chars, unique within a question
- 2 to 5 options per question
- Exactly 1 correct option per question

## 5. Data Model and Persistence Plan
**Entities**
- Quiz
  - id (UUID)
  - title
  - createdAt, updatedAt
- Question
  - id
  - quizId (FK)
  - text
  - orderIndex
  - createdAt, updatedAt
- Option
  - id
  - questionId (FK)
  - text
  - isCorrect (boolean)
  - orderIndex
  - createdAt, updatedAt

**SQLite schema concept**
- quizzes (id PK)
- questions (id PK, quizId FK)
- options (id PK, questionId FK)
- Indexes on quizId and questionId for fast retrieval

**Integrity rules**
- Exactly one correct option per question
- Enforced in main process validation
- Optional DB constraint with a partial index or trigger (later)

**Atomic saves**
- Save question and options in a single transaction
- Roll back if validation fails

**Storage location**
- Use OS app data directory
  - Windows: %APPDATA%
  - macOS: ~/Library/Application Support
  - Linux: ~/.local/share

## 6. UI/UX Considerations
**Screens and navigation**
- Home: list of quizzes
- Quiz editor: questions list and details
- Question editor: options and correct answer
- Player: play through quiz
- Results: summary and score

**Form layout**
- Question form at top, options below
- Add option button, remove option actions
- Reorder via up/down controls in MVP

**Inline validation**
- Show errors on blur and on save
- Clear error once resolved
- Soft warnings when approaching length limits (e.g., > 120 chars)

**Empty states and confirmations**
- No quizzes: prompt to create one
- Delete confirmations for quizzes/questions
- Undo toast after delete

**Save strategy**
- Manual save in MVP
- Autosave as later improvement

**Accessibility**
- Keyboard navigation
- Visible focus states
- Adequate touch targets

## 7. Step-by-Step Implementation Phases (From Setup to Prototype)
Note: Plan for one Codex run per phase.

### Phase 0: MVP spec + scope freeze
**Objective**
- Lock scope and acceptance criteria
**Checklist**
- [ ] Confirm MVP features and non-goals
- [ ] Approve data model fields
- [ ] Approve validation rules
- [ ] Confirm UX choices (per-question review, delete undo, reorder controls)
**Deliverable**
- Approved PLAN.md and DECISIONS.md

### Phase 1: Project skeleton + routing
**Objective**
- Establish baseline app shell and navigation
**Checklist**
- [ ] Create Electron + React + TypeScript structure
- [ ] Basic routing between core screens
- [ ] Placeholder UI for navigation
**Acceptance criteria**
- App opens and navigates between placeholder screens

### Phase 2: IPC contract + domain models + validation design
**Objective**
- Define API surface and validation rules
**Checklist**
- [ ] Define IPC endpoints for quiz CRUD
- [ ] Define validation errors and codes
- [ ] Document domain models and contracts
**Acceptance criteria**
- IPC contract documented and reviewed

### Phase 3: SQLite schema + migrations + repositories (design only)
**Objective**
- Design storage layer and migrations
**Checklist**
- [ ] Schema design with tables and indexes
- [ ] Migration approach documented
- [ ] Repository interfaces defined
**Acceptance criteria**
- Storage design reviewed and approved

### Phase 4: Quiz list + quiz editor UI (design/steps only)
**Objective**
- Design UI for listing and editing quizzes
**Checklist**
- [ ] Quiz list layout and empty state design
- [ ] Quiz create/rename/delete flow
- [ ] Editor layout for question list
**Acceptance criteria**
- UI flow documented with screen list and actions

### Phase 5: Question editor UI + validation (design/steps only)
**Objective**
- Design question editing and validation behavior
**Checklist**
- [ ] Question form layout
- [ ] Option add/remove flow
- [ ] Correct answer selection UI
- [ ] Validation display rules
**Acceptance criteria**
- Validation and UX behavior documented

### Phase 6: Player + results (design/steps only)
**Objective**
- Design quiz play flow and results screen
**Checklist**
- [ ] Single-question play flow
- [ ] Progress indicator behavior
- [ ] Results summary layout
**Acceptance criteria**
- Player flow documented end-to-end

### Phase 7: Packaging (electron-builder) + smoke tests
**Objective**
- Prepare for cross-platform packaging
**Checklist**
- [ ] Packaging targets documented
- [ ] Basic manual smoke test checklist
- [ ] Install/uninstall guidance
**Acceptance criteria**
- Packaging plan ready for implementation

## 8. Done Definition for the Prototype
- Create, edit, and delete quizzes
- Persist quizzes across restarts
- Play a quiz start to finish
- Show results summary with per-question review
- Enforce exactly one correct answer per question
- Installable on Windows, macOS, and Linux

## 9. Future Enhancements (Post-MVP)
- Import/export JSON
- Shuffle questions and options
- Question bank and reuse
- Tags or categories
- Drag-and-drop reordering
- Theming
- Auto-updates (optional)

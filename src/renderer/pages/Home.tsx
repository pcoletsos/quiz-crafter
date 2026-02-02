import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { QuizSummary } from "../../shared/types";

const Home = () => {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "rename">("create");
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalTarget, setModalTarget] = useState<QuizSummary | null>(null);
  const pendingDelete = useRef<{ id: string; timeoutId: number } | null>(null);
  const navigate = useNavigate();

  const loadQuizzes = () => {
    setLoading(true);
    window.quizCrafter
      .listQuizzes()
      .then((result) => {
        if (result.ok) {
          setQuizzes(result.data);
          setError("");
        } else {
          setError(result.errors.map((item) => item.message).join(" "));
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load quizzes.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const finalizePendingDelete = () => {
    if (pendingDelete.current) {
      const { id, timeoutId } = pendingDelete.current;
      window.clearTimeout(timeoutId);
      window.quizCrafter.deleteQuiz(id).catch(() => undefined);
      pendingDelete.current = null;
    }
  };

  const openModal = (mode: "create" | "rename", quiz?: QuizSummary) => {
    finalizePendingDelete();
    setModalMode(mode);
    setModalTarget(quiz ?? null);
    setModalTitle(quiz?.title ?? "");
    setModalDescription(quiz?.description ?? "");
    setModalError("");
    setModalOpen(true);
  };

  const handleCreate = () => openModal("create");

  const handleRename = (quiz: QuizSummary) => openModal("rename", quiz);

  const handleModalClose = () => {
    if (modalSubmitting) return;
    setModalOpen(false);
  };

  const handleModalSubmit = async () => {
    const title = modalTitle.trim();
    const description = modalDescription.trim();
    if (!title) {
      setModalError("Title is required.");
      return;
    }
    setModalSubmitting(true);
    setModalError("");
    try {
      if (modalMode === "create") {
        const result = await window.quizCrafter.createQuiz({
          title,
          description: description || null,
        });
        if (result.ok) {
          setModalOpen(false);
          loadQuizzes();
        } else {
          setModalError(result.errors.map((item) => item.message).join(" "));
        }
      } else if (modalTarget) {
        const result = await window.quizCrafter.updateQuiz({
          id: modalTarget.id,
          title,
          description: description || null,
        });
        if (result.ok) {
          setModalOpen(false);
          loadQuizzes();
        } else {
          setModalError(result.errors.map((item) => item.message).join(" "));
        }
      }
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleOpen = (quiz: QuizSummary) => {
    window.localStorage.setItem("activeQuizId", quiz.id);
    navigate("/quiz-editor");
  };

  const handleDelete = (quiz: QuizSummary) => {
    finalizePendingDelete();
    setQuizzes((prev) => prev.filter((item) => item.id !== quiz.id));
    const timeoutId = window.setTimeout(() => {
      window.quizCrafter.deleteQuiz(quiz.id).catch(() => undefined);
      pendingDelete.current = null;
      setToast(null);
    }, 5000);
    pendingDelete.current = { id: quiz.id, timeoutId };
    setToast({
      message: `Deleted "${quiz.title}".`,
      onUndo: () => {
        if (pendingDelete.current?.id === quiz.id) {
          window.clearTimeout(pendingDelete.current.timeoutId);
          pendingDelete.current = null;
        }
        setToast(null);
        loadQuizzes();
      },
    });
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Quiz Library</h2>
          <p className="muted">Create and manage your local quizzes.</p>
        </div>
        <div className="actions">
          <button className="ghost">Import</button>
          <button className="primary" onClick={handleCreate}>
            New Quiz
          </button>
        </div>
      </header>

      <div className="panel__body">
        {error && (
          <div className="alert alert--inline">
            <div>
              <strong>Could not load quizzes.</strong>
              <p className="muted">{error}</p>
            </div>
            <button className="ghost" onClick={loadQuizzes}>
              Retry
            </button>
          </div>
        )}
        {loading && <div className="loading">Loading quizzes...</div>}
        {!error && !loading && quizzes.length === 0 && (
          <div className="empty-state">
            <h3>No quizzes yet</h3>
            <p>Create your first quiz to get started.</p>
          </div>
        )}
        {quizzes.length > 0 && (
          <div className="grid">
            {quizzes.map((quiz) => (
              <article key={quiz.id} className="card card--interactive">
                <div className="card__header">
                  <h3>{quiz.title}</h3>
                  <span className="badge">{quiz.questionCount} questions</span>
                </div>
                <p className="muted">
                  {quiz.description?.trim()
                    ? quiz.description
                    : "No description provided."}
                </p>
                <p className="muted">
                  Last updated {new Date(quiz.updatedAt).toLocaleDateString()}
                </p>
                <div className="actions">
                  <button className="ghost" onClick={() => handleOpen(quiz)}>
                    Open
                  </button>
                  <button className="ghost" onClick={() => handleRename(quiz)}>
                    Rename
                  </button>
                  <button className="ghost" onClick={() => handleDelete(quiz)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="toast">
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button className="ghost" onClick={toast.onUndo}>
              Undo
            </button>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal__header">
              <h3>{modalMode === "create" ? "New Quiz" : "Rename Quiz"}</h3>
              <button className="ghost" onClick={handleModalClose}>
                Close
              </button>
            </div>
            <div className="modal__body">
              <div className="field">
                <label>Title</label>
                <input
                  value={modalTitle}
                  onChange={(event) => setModalTitle(event.target.value)}
                  placeholder="Enter quiz title"
                />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={modalDescription}
                  onChange={(event) => setModalDescription(event.target.value)}
                  placeholder="Optional description"
                />
              </div>
              {modalError && <div className="alert">{modalError}</div>}
            </div>
            <div className="modal__footer">
              <button className="ghost" onClick={handleModalClose} disabled={modalSubmitting}>
                Cancel
              </button>
              <button className="primary" onClick={handleModalSubmit} disabled={modalSubmitting}>
                {modalMode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Home;

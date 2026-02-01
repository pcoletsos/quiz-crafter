import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { QuizSummary } from "../../shared/types";

const Home = () => {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [error, setError] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(
    null,
  );
  const pendingDelete = useRef<{ id: string; timeoutId: number } | null>(null);
  const navigate = useNavigate();

  const loadQuizzes = () => {
    window.quizCrafter
      .listQuizzes()
      .then((result) => {
        if (result.ok) {
          setQuizzes(result.data);
          setError("");
        } else {
          setError(result.errors.map((item) => item.message).join(" "));
        }
      })
      .catch(() => setError("Unable to load quizzes."));
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

  const handleCreate = async () => {
    finalizePendingDelete();
    const title = window.prompt("Quiz title", "Untitled Quiz");
    if (!title) return;
    const result = await window.quizCrafter.createQuiz({ title });
    if (result.ok) {
      loadQuizzes();
    } else {
      setError(result.errors.map((item) => item.message).join(" "));
    }
  };

  const handleRename = async (quiz: QuizSummary) => {
    const title = window.prompt("Rename quiz", quiz.title);
    if (!title || title === quiz.title) return;
    const result = await window.quizCrafter.updateQuiz({ id: quiz.id, title });
    if (result.ok) {
      loadQuizzes();
    } else {
      setError(result.errors.map((item) => item.message).join(" "));
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
        {error && <div className="alert">{error}</div>}
        {!error && quizzes.length === 0 && (
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
                <p className="muted">Last updated {new Date(quiz.updatedAt).toLocaleDateString()}</p>
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
    </section>
  );
};

export default Home;

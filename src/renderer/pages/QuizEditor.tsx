import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Quiz } from "../../shared/types";

const QuizEditor = () => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadQuiz = async () => {
    setLoading(true);
    const quizId = window.localStorage.getItem("activeQuizId");
    if (!quizId) {
      setError("Select a quiz from the library.");
      setLoading(false);
      return;
    }
    const result = await window.quizCrafter.getQuiz(quizId);
    if (result.ok) {
      setQuiz(result.data);
      setTitle(result.data.title);
      setDescription(result.data.description ?? "");
      setError("");
    } else {
      setError(result.errors.map((item) => item.message).join(" "));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuiz();
  }, []);

  const handleSave = async () => {
    if (!quiz) return;
    const result = await window.quizCrafter.updateQuiz({
      id: quiz.id,
      title,
      description,
    });
    if (result.ok) {
      loadQuiz();
    } else {
      setError(result.errors.map((item) => item.message).join(" "));
    }
  };

  const handleAddQuestion = () => {
    window.localStorage.removeItem("activeQuestionId");
    navigate("/question-editor");
  };

  const handleEditQuestion = (questionId: string) => {
    window.localStorage.setItem("activeQuestionId", questionId);
    navigate("/question-editor");
  };

  const handleReorder = async (questionId: string, direction: "up" | "down") => {
    if (!quiz) return;
    const result = await window.quizCrafter.reorderQuestion({
      quizId: quiz.id,
      questionId,
      direction,
    });
    if (result.ok) {
      setQuiz(result.data);
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Quiz Editor</h2>
          <p className="muted">Editing: {quiz?.title ?? "Select a quiz"}</p>
        </div>
        <div className="actions">
          <button className="ghost">Preview</button>
          <button className="primary" onClick={handleAddQuestion}>
            Add Question
          </button>
        </div>
      </header>

      <div className="panel__body split">
        <div className="card">
          <h3>Quiz Details</h3>
          <div className="field">
            <label>Title</label>
            <input
              placeholder="Enter quiz title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              placeholder="Optional description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="actions">
            <button className="ghost" onClick={() => navigate("/")}>
              Back
            </button>
            <button className="primary" onClick={handleSave}>
              Save Quiz
            </button>
          </div>
          {error && (
            <div className="alert alert--inline">
              <div>
                <strong>Save failed.</strong>
                <p className="muted">{error}</p>
              </div>
              <button className="ghost" onClick={handleSave}>
                Retry
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card__header">
            <h3>Questions</h3>
            <span className="badge">{quiz?.questions.length ?? 0} total</span>
          </div>
          {loading && <div className="loading">Loading questions...</div>}
          {!quiz && <p className="muted">Select a quiz to view questions.</p>}
          {quiz?.questions.length === 0 && (
            <div className="empty-state">
              <h3>No questions yet</h3>
              <p>Add your first question to begin.</p>
            </div>
          )}
          {quiz && quiz.questions.length > 0 && (
            <ul className="list list--cards">
              {[...quiz.questions]
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((question, idx) => (
                  <li key={question.id} className="list__item">
                    <div>
                      <strong>{idx + 1}.</strong> {question.text || "Untitled question"}
                      <p className="muted">
                        {question.options.length} options ·{" "}
                        {question.options.filter((option) => option.isCorrect).length} correct
                      </p>
                    </div>
                    <div className="actions">
                      <button className="ghost" onClick={() => handleEditQuestion(question.id)}>
                        Edit
                      </button>
                      <button className="ghost" onClick={() => handleReorder(question.id, "up")}>
                        Up
                      </button>
                      <button className="ghost" onClick={() => handleReorder(question.id, "down")}>
                        Down
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default QuizEditor;

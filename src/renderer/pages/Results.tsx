import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Quiz, QuizResult } from "../../shared/types";

const Results = () => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const quizId = window.localStorage.getItem("activeQuizId");
    if (!quizId) {
      setError("Select a quiz from the library.");
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      window.quizCrafter.getQuiz(quizId),
      window.quizCrafter.getResultsSummary(quizId),
    ]).then(([quizResult, summary]) => {
      if (quizResult.ok) {
        setQuiz(quizResult.data);
      } else {
        setError(quizResult.errors.map((item) => item.message).join(" "));
      }
      if (summary.ok) {
        setResult(summary.data.lastResult ?? null);
      } else {
        setError(summary.errors.map((item) => item.message).join(" "));
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <section className="panel">
        <div className="loading">Loading results...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <div className="alert alert--inline">
          <div>
            <strong>Unable to load results.</strong>
            <p className="muted">{error}</p>
          </div>
          <button className="ghost" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!quiz || !result) {
    return (
      <section className="panel">
        <div className="empty-state">
          <h3>No results yet</h3>
          <p>Complete a quiz to see a summary here.</p>
        </div>
      </section>
    );
  }

  const questionsById = new Map(quiz.questions.map((question) => [question.id, question]));
  const scoreText = `${result.correctCount} / ${result.totalCount}`;
  const incorrectCount = result.totalCount - result.correctCount;

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Results</h2>
          <p className="muted">{quiz.title}</p>
        </div>
        <div className="pill">Score {scoreText}</div>
      </header>

      <div className="panel__body">
        <div className="summary">
          <div>
            <h3>Performance</h3>
            <p className="muted">
              {result.correctCount} correct · {incorrectCount} incorrect
            </p>
          </div>
          <button className="ghost">Review Mistakes</button>
        </div>

        {result.answers.map((answer) => {
          const question = questionsById.get(answer.questionId);
          const correctOption = question?.options.find(
            (option) => option.id === answer.correctOptionId,
          );
          const selectedOption = question?.options.find(
            (option) => option.id === answer.selectedOptionId,
          );
          return (
            <div key={answer.questionId} className="card">
              <h3>{question?.text ?? "Question"}</h3>
              <p className="muted">
                Selected: {selectedOption?.text ?? "No answer"} · Correct:{" "}
                {correctOption?.text ?? "Unknown"}
              </p>
            </div>
          );
        })}
        <div className="actions">
          <button className="ghost" onClick={() => navigate("/player")}>
            Play Again
          </button>
          <button className="primary" onClick={() => navigate("/")}>
            Back to Library
          </button>
        </div>
      </div>
    </section>
  );
};

export default Results;

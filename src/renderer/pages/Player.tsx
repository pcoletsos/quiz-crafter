import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Quiz, QuizResultSaveInput } from "../../shared/types";

const Player = () => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const quizId = window.localStorage.getItem("activeQuizId");
    if (!quizId) {
      setError("Select a quiz from the library.");
      return;
    }
    window.quizCrafter.getQuiz(quizId).then((result) => {
      if (result.ok) {
        const sorted = {
          ...result.data,
          questions: result.data.questions
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex),
        };
        setQuiz(sorted);
        setError("");
      } else {
        setError(result.errors.map((item) => item.message).join(" "));
      }
    });
  }, []);

  const currentQuestion = useMemo(() => {
    if (!quiz) return null;
    return quiz.questions[questionIndex] ?? null;
  }, [quiz, questionIndex]);

  const totalQuestions = quiz?.questions.length ?? 0;
  const progressPercent = totalQuestions ? Math.round(((questionIndex + 1) / totalQuestions) * 100) : 0;

  const handleSelect = (optionId: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const handleFinish = async () => {
    if (!quiz) return;
    const payload: QuizResultSaveInput = {
      quizId: quiz.id,
      answers: quiz.questions.map((question) => {
        const correct = question.options.find((option) => option.isCorrect);
        return {
          questionId: question.id,
          selectedOptionId: answers[question.id] ?? null,
          correctOptionId: correct?.id ?? "",
        };
      }),
    };
    const result = await window.quizCrafter.saveResults(payload);
    if (result.ok) {
      navigate("/results");
    } else {
      setError(result.errors.map((item) => item.message).join(" "));
    }
  };

  if (error) {
    return (
      <section className="panel">
        <div className="alert">{error}</div>
      </section>
    );
  }

  if (!quiz || !currentQuestion) {
    return (
      <section className="panel">
        <div className="empty-state">
          <h3>No questions available</h3>
          <p>Add questions in the editor to start playing.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Player</h2>
          <p className="muted">
            Question {questionIndex + 1} of {totalQuestions} · {quiz.title}
          </p>
        </div>
        <div className="pill">In progress</div>
      </header>

      <div className="panel__body">
        <div className="card">
          <h3>{currentQuestion.text || "Untitled question"}</h3>
          <p className="muted">Select the single best answer.</p>
          {currentQuestion.options
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((option) => (
              <label key={option.id} className="option-row option-row--clickable">
                <input
                  type="radio"
                  name={`player-${currentQuestion.id}`}
                  checked={answers[currentQuestion.id] === option.id}
                  onChange={() => handleSelect(option.id)}
                />
                <span>{option.text}</span>
              </label>
            ))}
        </div>

        <div className="actions actions--space">
          <button
            className="ghost"
            onClick={() => setQuestionIndex((prev) => Math.max(prev - 1, 0))}
            disabled={questionIndex === 0}
          >
            Previous
          </button>
          <div className="progress">
            <div
              className="progress__bar"
              style={{ background: `linear-gradient(90deg, #f97316 ${progressPercent}%, #e5e7eb ${progressPercent}%)` }}
            />
            <span className="muted">{progressPercent}% complete</span>
          </div>
          {questionIndex < totalQuestions - 1 ? (
            <button
              className="primary"
              onClick={() => setQuestionIndex((prev) => Math.min(prev + 1, totalQuestions - 1))}
            >
              Next
            </button>
          ) : (
            <button className="primary" onClick={handleFinish}>
              Finish
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Player;

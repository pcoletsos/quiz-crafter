import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Option, Question, Quiz } from "../../shared/types";
import { LIMITS } from "../../shared/validation";

const createOption = (text = "", isCorrect = false, orderIndex = 0): Option => ({
  id: "",
  questionId: "",
  text,
  isCorrect,
  orderIndex,
});

const QuestionEditor = () => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [text, setText] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const navigate = useNavigate();

  const loadQuestion = async () => {
    setLoading(true);
    const quizId = window.localStorage.getItem("activeQuizId");
    if (!quizId) {
      setError("Select a quiz from the library.");
      setLoading(false);
      return;
    }
    const result = await window.quizCrafter.getQuiz(quizId);
    if (!result.ok) {
      setError(result.errors.map((item) => item.message).join(" "));
      setLoading(false);
      return;
    }

    const quizData = result.data;
    setQuiz(quizData);
    const questionId = window.localStorage.getItem("activeQuestionId");
    const existing = quizData.questions.find((item) => item.id === questionId) ?? null;
    setQuestion(existing);
    setText(existing?.text ?? "");
    if (existing) {
      setOptions(
        existing.options
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((option) => ({ ...option })),
      );
    } else {
      setOptions([
        createOption("", true, 0),
        createOption("", false, 1),
        createOption("", false, 2),
        createOption("", false, 3),
      ]);
    }
    setError("");
    setLoading(false);
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  const updateOption = (index: number, value: Partial<Option>) => {
    setOptions((prev) =>
      prev.map((option, idx) => (idx === index ? { ...option, ...value } : option)),
    );
  };

  const handleCorrectSelect = (index: number) => {
    setOptions((prev) =>
      prev.map((option, idx) => ({ ...option, isCorrect: idx === index })),
    );
  };

  const handleAddOption = () => {
    if (options.length >= LIMITS.optionsMax) return;
    setOptions((prev) => [
      ...prev,
      createOption("", false, prev.length),
    ]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleReorderOption = async (option: Option, direction: "up" | "down") => {
    if (!quiz || !question) return;
    if (!option.id) {
      const newOptions = [...options];
      const index = newOptions.indexOf(option);
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= newOptions.length) return;
      [newOptions[index], newOptions[target]] = [newOptions[target], newOptions[index]];
      setOptions(newOptions);
      return;
    }
    const result = await window.quizCrafter.reorderOption({
      quizId: quiz.id,
      questionId: question.id,
      optionId: option.id,
      direction,
    });
    if (result.ok) {
      setQuestion(result.data);
      setOptions(
        result.data.options.slice().sort((a, b) => a.orderIndex - b.orderIndex),
      );
    }
  };

  const handleSave = async () => {
    if (!quiz) {
      setError("Select a quiz from the library.");
      return;
    }
    const payload = {
      quizId: quiz.id,
      questionId: question?.id,
      text,
      options: options.map((option, index) => ({
        id: option.id || undefined,
        text: option.text,
        isCorrect: option.isCorrect,
        orderIndex: index,
      })),
    };
    setSaving(true);
    setSaveNotice("");
    setError("");
    try {
      const result = await window.quizCrafter.saveQuestion(payload);
      if (result.ok) {
        window.localStorage.setItem("activeQuestionId", result.data.id);
        setQuestion(result.data);
        setOptions(result.data.options.slice().sort((a, b) => a.orderIndex - b.orderIndex));
        setSaveNotice("Question saved.");
      } else {
        setError(result.errors.map((item) => item.message).join(" "));
      }
    } catch {
      setError("Unable to save question. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="panel">
        <div className="loading">Loading question...</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Question Editor</h2>
          <p className="muted">
            {quiz?.title ?? "Select a quiz"} ·{" "}
            {question ? "Editing question" : "New question"}
          </p>
        </div>
        <div className="actions">
          <button className="ghost" onClick={() => navigate("/quiz-editor")}>
            Back
          </button>
          <button className="primary" onClick={handleSave}>
            Save Question
          </button>
        </div>
      </header>

      <div className="panel__body split">
        <div className="card">
          <h3>Question</h3>
          <div className="field">
            <label>Prompt</label>
            <textarea
              placeholder="Enter question text"
              rows={5}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <p className="helper">
              {text.length} / {LIMITS.questionTextMax}
            </p>
          </div>
          <div className="field">
            <label>Help text</label>
            <input placeholder="Optional hint" />
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
          {saveNotice && <div className="notice">{saveNotice}</div>}
        </div>

        <div className="card">
          <div className="card__header">
            <h3>Options</h3>
            <span className="badge">
              {options.length} of {LIMITS.optionsMax} max
            </span>
          </div>
          {options.map((option, index) => (
            <div key={index} className="option-row">
              <input
                type="radio"
                name="correct"
                checked={option.isCorrect}
                onChange={() => handleCorrectSelect(index)}
              />
              <input
                placeholder={`Option ${index + 1}`}
                value={option.text}
                onChange={(event) => updateOption(index, { text: event.target.value })}
              />
              <div className="actions actions--compact">
                <button className="ghost" onClick={() => handleReorderOption(option, "up")}>
                  Up
                </button>
                <button className="ghost" onClick={() => handleReorderOption(option, "down")}>
                  Down
                </button>
                <button className="ghost" onClick={() => handleRemoveOption(index)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="actions">
            <button className="ghost" onClick={handleAddOption}>
              Add Option
            </button>
            {saving && <span className="muted">Saving...</span>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuestionEditor;

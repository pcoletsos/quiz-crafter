import type { QuestionSaveInput, ValidationError, ValidationResult } from "./types";

export const LIMITS = {
  quizTitleMax: 200,
  questionTextMax: 1200,
  optionTextMax: 500,
  optionsMin: 2,
  optionsMax: 5,
} as const;

const error = (field: string, code: string, message: string): ValidationError => ({
  field,
  code,
  message,
});

export const validateQuizTitle = (title: string): ValidationResult => {
  const errors: ValidationError[] = [];
  const trimmed = title.trim();

  if (!trimmed) {
    errors.push(error("title", "required", "Quiz title is required."));
  }

  if (trimmed.length > LIMITS.quizTitleMax) {
    errors.push(
      error(
        "title",
        "max_length",
        `Quiz title must be ${LIMITS.quizTitleMax} characters or fewer.`,
      ),
    );
  }

  return errors.length ? { ok: false, errors } : { ok: true };
};

export const validateQuestion = (input: QuestionSaveInput): ValidationResult => {
  const errors: ValidationError[] = [];
  const text = input.text.trim();

  if (!text) {
    errors.push(error("text", "required", "Question text is required."));
  }

  if (text.length > LIMITS.questionTextMax) {
    errors.push(
      error(
        "text",
        "max_length",
        `Question text must be ${LIMITS.questionTextMax} characters or fewer.`,
      ),
    );
  }

  if (input.options.length < LIMITS.optionsMin || input.options.length > LIMITS.optionsMax) {
    errors.push(
      error(
        "options",
        "count",
        `Question must have ${LIMITS.optionsMin}-${LIMITS.optionsMax} options.`,
      ),
    );
  }

  const optionTexts = new Set<string>();
  let correctCount = 0;

  input.options.forEach((option, index) => {
    const optionText = option.text.trim();
    const fieldPrefix = `options[${index}]`;

    if (!optionText) {
      errors.push(error(`${fieldPrefix}.text`, "required", "Option text is required."));
    }

    if (optionText.length > LIMITS.optionTextMax) {
      errors.push(
        error(
          `${fieldPrefix}.text`,
          "max_length",
          `Option text must be ${LIMITS.optionTextMax} characters or fewer.`,
        ),
      );
    }

    if (optionText) {
      const key = optionText.toLowerCase();
      if (optionTexts.has(key)) {
        errors.push(
          error(`${fieldPrefix}.text`, "duplicate", "Option text must be unique."),
        );
      }
      optionTexts.add(key);
    }

    if (option.isCorrect) {
      correctCount += 1;
    }
  });

  if (correctCount !== 1) {
    errors.push(
      error("options", "correct_count", "Exactly one option must be marked correct."),
    );
  }

  return errors.length ? { ok: false, errors } : { ok: true };
};

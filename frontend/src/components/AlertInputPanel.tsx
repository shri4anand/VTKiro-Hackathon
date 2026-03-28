import { useState } from "react";
import { validateInput } from "../utils/validateInput";

interface AlertInputPanelProps {
  inputText: string;
  onChange: (text: string) => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

const MAX_CHARS = 10000;

export function AlertInputPanel({
  inputText,
  onChange,
  onSubmit,
  isLoading,
}: AlertInputPanelProps) {
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const validation = validateInput(inputText);
  const isOverLimit = inputText.length > MAX_CHARS;
  const isDisabled = isOverLimit || isLoading;

  // Over-limit error is always visible (button is disabled, so submit can't be attempted).
  // Empty error only shows after a submit attempt.
  const showError =
    isOverLimit || (attemptedSubmit && !validation.valid);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (validation.valid) {
      onSubmit(inputText);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <textarea
          aria-label="Alert text input"
          aria-describedby={showError ? "input-error" : undefined}
          aria-invalid={showError ? true : undefined}
          value={inputText}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className={[
            "input-field",
            isOverLimit
              ? "border-red-500 focus:ring-red-500"
              : "border-slate-200",
          ].join(" ")}
          placeholder="Paste emergency alert text here…"
        />

        <div className="flex items-center justify-between text-sm">
          <span
            className={isOverLimit ? "text-red-600 font-medium" : "text-slate-500"}
          >
            {inputText.length} / {MAX_CHARS.toLocaleString()} characters
          </span>
        </div>

        {showError && (
          <p id="input-error" role="alert" className="text-sm text-red-600 font-medium">
            {validation.reason === "EMPTY"
              ? "Please enter alert text."
              : "Text exceeds 5,000 character limit."}
          </p>
        )}

        <button
          type="submit"
          aria-label="Simplify alert text"
          disabled={isDisabled}
          className={[
            "btn-primary self-start text-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          ].join(" ")}
        >
          {isLoading ? "Simplifying…" : "Simplify"}
        </button>
      </div>
    </form>
  );
}

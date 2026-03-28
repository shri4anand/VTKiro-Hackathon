import { useState } from "react";
import { validateInput } from "../utils/validateInput";

interface AlertInputPanelProps {
  inputText: string;
  onChange: (text: string) => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

const MAX_CHARS = 5000;

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
            "w-full rounded-md border p-3 text-sm resize-y",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            isOverLimit
              ? "border-red-500"
              : "border-gray-300",
          ].join(" ")}
          placeholder="Paste emergency alert text here…"
        />

        <div className="flex items-center justify-between text-sm">
          <span
            className={isOverLimit ? "text-red-600 font-medium" : "text-gray-500"}
          >
            {inputText.length} / {MAX_CHARS.toLocaleString()} characters
          </span>
        </div>

        {showError && (
          <p id="input-error" role="alert" className="text-sm text-red-600">
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
            "self-start rounded-md px-5 py-2 text-sm font-medium text-white transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            isDisabled
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
          ].join(" ")}
        >
          {isLoading ? "Simplifying…" : "Simplify"}
        </button>
      </div>
    </form>
  );
}

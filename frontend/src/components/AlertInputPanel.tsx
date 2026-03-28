import { useState } from "react";
import { validateInput } from "../utils/validateInput";

interface AlertInputPanelProps {
  inputText: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
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

  const showError = isOverLimit || (attemptedSubmit && !validation.valid);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (validation.valid) {
      onSubmit();
    }
  }

  return (
    <div className="bg-surface-container-low rounded-xl p-6 lg:p-8 space-y-4">
      <label className="block">
        <span className="text-on-surface text-sm font-bold uppercase tracking-widest block mb-4">
          Emergency Alert Text
        </span>
        <textarea
          aria-label="Alert text input"
          aria-describedby={showError ? "input-error" : undefined}
          aria-invalid={showError ? true : undefined}
          value={inputText}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary-container min-h-[220px] rounded-lg p-6 text-on-surface text-lg leading-relaxed placeholder:text-outline/50 transition-all ${
            isOverLimit ? "ring-2 ring-error" : ""
          }`}
          placeholder="Paste your alert here (e.g., evacuation notice, weather warning)..."
        />
      </label>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-on-surface-variant text-sm font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">short_text</span>
          {inputText.length} / {MAX_CHARS.toLocaleString()} characters
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isDisabled}
          aria-label="Simplify alert text"
          className={`w-full sm:w-auto px-10 py-4 bg-primary text-on-primary rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform active:scale-95 shadow-xl shadow-primary/20 ${
            isDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Simplifying..." : "Simplify Now"}
        </button>
      </div>

      {showError && (
        <p id="input-error" role="alert" className="text-sm text-error font-medium">
          {validation.reason === "EMPTY"
            ? "Please enter alert text."
            : "Text exceeds 5,000 character limit."}
        </p>
      )}
    </div>
  );
}

import { SimplifiedVariant, AppError } from "../types";
import { SimplifiedCard } from "./SimplifiedCard";

interface OutputPanelProps {
  status: "idle" | "loading" | "success" | "error";
  variants: SimplifiedVariant[] | null;
  error: AppError | null;
  inputText: string;
  onRetry?: () => void;
  onHighlightInput?: () => void;
}

export function OutputPanel({
  status,
  variants,
  error,
  inputText,
  onRetry,
  onHighlightInput,
}: OutputPanelProps) {
  // Idle state: show nothing
  if (status === "idle") {
    return null;
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="inline-block">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        </div>
        <p className="mt-4 text-gray-600">Simplifying your alert…</p>
      </div>
    );
  }

  // Error state
  if (status === "error" && error) {
    const isRetryableError =
      error.code === "LLM_UNAVAILABLE" || error.code === "TIMEOUT";
    const isValidationError = error.code === "VALIDATION_ERROR";

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-red-800">Error</h2>
        <p className="mb-4 text-red-700">{error.error}</p>

        {isRetryableError && onRetry && (
          <button
            onClick={onRetry}
            aria-label="Retry simplification"
            className={[
              "rounded-md px-4 py-2 text-sm font-medium text-white transition-colors",
              "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            ].join(" ")}
          >
            Retry
          </button>
        )}

        {isValidationError && onHighlightInput && (
          <button
            onClick={onHighlightInput}
            aria-label="Focus on input field"
            className={[
              "rounded-md px-4 py-2 text-sm font-medium text-white transition-colors",
              "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            ].join(" ")}
          >
            Fix Input
          </button>
        )}
      </div>
    );
  }

  // Success state: render all three cards
  if (status === "success" && variants && variants.length === 3) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Simplified Versions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {variants.map((variant) => (
            <SimplifiedCard
              key={variant.level}
              variant={variant}
              onRetry={onRetry}
              showRetryButton={false}
            />
          ))}
        </div>
      </div>
    );
  }

  // Fallback: should not reach here
  return null;
}

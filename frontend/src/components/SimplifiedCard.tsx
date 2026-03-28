import { SimplifiedVariant, ReadingLevel } from "../types";

interface SimplifiedCardProps {
  variant: SimplifiedVariant;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

const levelLabels: Record<ReadingLevel, string> = {
  grade3: "Grade 3",
  grade6: "Grade 6",
  grade9: "Grade 9",
};

export function SimplifiedCard({
  variant,
  onRetry,
  showRetryButton = false,
}: SimplifiedCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Level Badge */}
      <div className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
        {levelLabels[variant.level]}
      </div>

      {/* Simplified Text */}
      <p className="mb-4 text-base leading-relaxed text-gray-800">
        {variant.text}
      </p>

      {/* FK Score */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <span className="text-sm text-gray-600">
          Reading Level: <span className="font-semibold">{variant.fkScore.toFixed(1)}</span>
        </span>
      </div>

      {/* Retry Button (shown on certain errors) */}
      {showRetryButton && onRetry && (
        <button
          onClick={onRetry}
          aria-label="Retry simplification"
          className={[
            "mt-4 w-full rounded-md px-4 py-2 text-sm font-medium text-white transition-colors",
            "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          ].join(" ")}
        >
          Retry
        </button>
      )}
    </div>
  );
}

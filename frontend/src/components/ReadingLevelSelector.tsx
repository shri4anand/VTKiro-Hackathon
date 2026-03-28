import { ReadingLevel } from "../types";

const LEVELS: { code: ReadingLevel; label: string }[] = [
  { code: "grade3", label: "Beginner" },
  { code: "grade6", label: "Intermediate" },
  { code: "grade9", label: "Comprehensive" },
];

interface ReadingLevelSelectorProps {
  activeLevel: ReadingLevel;
  onChange: (level: ReadingLevel) => void;
}

export function ReadingLevelSelector({ activeLevel, onChange }: ReadingLevelSelectorProps) {
  return (
    <div role="group" aria-label="Select reading level" className="flex gap-2">
      {LEVELS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          aria-label={`Select ${label} reading level`}
          aria-pressed={activeLevel === code}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            activeLevel === code
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

import { ReadingLevel } from "../types";

const LEVELS: { code: ReadingLevel; label: string }[] = [
  { code: "grade3", label: "Grade 3" },
  { code: "grade6", label: "Grade 6" },
  { code: "grade9", label: "Grade 9" },
];

interface ReadingLevelSelectorProps {
  activeLevel: ReadingLevel;
  onChange: (level: ReadingLevel) => void;
}

export function ReadingLevelSelector({ activeLevel, onChange }: ReadingLevelSelectorProps) {
  const levelColors: Record<ReadingLevel, { active: string; inactive: string }> = {
    grade3: {
      active: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg",
      inactive: "bg-slate-100 text-slate-700 hover:bg-slate-200"
    },
    grade6: {
      active: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg",
      inactive: "bg-slate-100 text-slate-700 hover:bg-slate-200"
    },
    grade9: {
      active: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg",
      inactive: "bg-slate-100 text-slate-700 hover:bg-slate-200"
    },
  };

  return (
    <div role="group" aria-label="Select reading level" className="flex gap-2">
      {LEVELS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          aria-label={`Select ${label} reading level`}
          aria-pressed={activeLevel === code}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
            activeLevel === code
              ? levelColors[code].active
              : levelColors[code].inactive
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

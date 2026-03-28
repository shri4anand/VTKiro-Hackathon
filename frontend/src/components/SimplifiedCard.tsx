import { SimplifiedVariant, Language } from "../types";
import { AudioControls } from "./AudioControls";

interface SimplifiedCardProps {
  variant: SimplifiedVariant;
  language: Language;
}

const levelLabels: Record<string, string> = {
  grade3: "Grade 3",
  grade6: "Grade 6",
  grade9: "Grade 9",
};

export function SimplifiedCard({ variant, language }: SimplifiedCardProps) {
  const levelColors: Record<string, { bg: string; border: string; badge: string; text: string }> = {
    grade3: {
      bg: "from-emerald-50 to-teal-50",
      border: "border-l-4 border-emerald-500",
      badge: "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 border border-emerald-200",
      text: "text-emerald-900"
    },
    grade6: {
      bg: "from-blue-50 to-cyan-50",
      border: "border-l-4 border-blue-500",
      badge: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200",
      text: "text-blue-900"
    },
    grade9: {
      bg: "from-purple-50 to-indigo-50",
      border: "border-l-4 border-purple-500",
      badge: "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200",
      text: "text-purple-900"
    },
  };

  const colors = levelColors[variant.level] || levelColors.grade6;

  return (
    <div className={`bg-gradient-to-br ${colors.bg} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 ${colors.border} border-b border-r border-slate-100`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-block ${colors.badge} px-3 py-1 rounded-full text-sm font-semibold`}>
          {levelLabels[variant.level]}
        </span>
        <span className="text-xs text-slate-600 font-medium">
          FK Score: {variant.fkScore.toFixed(1)}
        </span>
      </div>

      <p className={`${colors.text} leading-relaxed mb-4 text-sm`}>
        {variant.text}
      </p>

      <AudioControls variant={variant} language={language} />
    </div>
  );
}

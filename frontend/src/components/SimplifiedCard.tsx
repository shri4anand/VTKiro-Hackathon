import { SimplifiedVariant, Language } from "../types";
import { AudioControls } from "./AudioControls";
import { useAppState } from "../store/appState";

interface SimplifiedCardProps {
  variant: SimplifiedVariant;
  language: Language;
  isFirst?: boolean;
}

const levelLabels: Record<string, string> = {
  grade3: "Beginner",
  grade6: "Intermediate",
  grade9: "Comprehensive",
};

export function SimplifiedCard({ variant, language, isFirst = false }: SimplifiedCardProps) {
  const state = useAppState();
  const isPlaying = state.playingLevel === variant.level;

  const textSizeClass = variant.level === "grade3" ? "text-2xl" : variant.level === "grade6" ? "text-xl" : "text-lg";
  const fontWeightClass = variant.level === "grade3" ? "font-medium" : "font-normal";
  const italicClass = variant.level === "grade9" ? "italic opacity-80" : "";

  // Color scheme per grade level
  const colorScheme = {
    grade3: {
      bg: "bg-surface-container-lowest shadow-sm",
      border: "border-l-8 border-primary",
      badge: "bg-primary text-on-primary",
      playingColor: "text-primary"
    },
    grade6: {
      bg: "bg-surface-container-low",
      border: "border-l-8 border-tertiary",
      badge: "bg-tertiary text-on-tertiary",
      playingColor: "text-tertiary"
    },
    grade9: {
      bg: "bg-surface-container-low",
      border: "border-l-8 border-secondary",
      badge: "bg-secondary text-on-secondary",
      playingColor: "text-secondary"
    }
  };

  const colors = colorScheme[variant.level];

  return (
    <div className={`rounded-xl p-8 relative overflow-hidden ${colors.bg} ${colors.border}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-tighter uppercase ${colors.badge}`}>
            Level: {levelLabels[variant.level]}
          </span>
          {isPlaying && (
            <div className={`flex items-center gap-1 ${colors.playingColor} animate-pulse`}>
              <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>graphic_eq</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Active Playing</span>
            </div>
          )}
        </div>
        <AudioControls variant={variant} language={language} />
      </div>
      <p className={`text-on-surface ${textSizeClass} ${fontWeightClass} ${italicClass} leading-[1.6]`}>
        {variant.text}
      </p>
    </div>
  );
}

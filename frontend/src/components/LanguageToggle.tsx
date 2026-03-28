import { Language } from "../types";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "zh", label: "Mandarin" },
  { code: "ar", label: "Arabic" },
  { code: "pt", label: "Portuguese" },
];

interface LanguageToggleProps {
  language: Language;
  onChange: (lang: Language) => void;
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <nav className="hidden md:flex items-center gap-6" role="group" aria-label="Select output language">
      {LANGUAGES.filter(l => l.code !== "en").map(({ code, label }) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          aria-label={`Select ${label}`}
          aria-pressed={language === code}
          className={`text-sm font-semibold transition-colors ${
            language === code
              ? "text-primary"
              : "text-on-surface hover:text-primary"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

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
    <div role="group" aria-label="Select output language" className="flex flex-wrap gap-2">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          aria-label={`Select ${label}`}
          aria-pressed={language === code}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
            language === code
              ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

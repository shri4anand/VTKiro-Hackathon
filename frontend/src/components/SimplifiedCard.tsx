import React from "react";
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
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
          {levelLabels[variant.level]}
        </span>
        <span className="text-xs text-gray-600">
          FK Score: {variant.fkScore.toFixed(1)}
        </span>
      </div>

      <p className="text-gray-800 leading-relaxed mb-4">
        {variant.text}
      </p>

      <AudioControls variant={variant} language={language} />
    </div>
  );
}

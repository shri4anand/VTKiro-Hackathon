import React from "react";
import { useTTS } from "../hooks/useTTS";
import { useAppState } from "../store/appState";
import { SimplifiedVariant, Language } from "../types";

interface AudioControlsProps {
  variant: SimplifiedVariant;
  language: Language;
}

export function AudioControls({ variant, language }: AudioControlsProps) {
  const { play, stop, isAvailable, error } = useTTS();
  const state = useAppState();
  const isPlaying = state.playingLevel === variant.level;

  const levelColors: Record<string, string> = {
    grade3: "from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
    grade6: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    grade9: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
  };

  const colors = levelColors[variant.level] || levelColors.grade6;

  if (!isAvailable) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={() => play(variant.text, language, variant.level)}
        disabled={isPlaying}
        aria-label={`Play audio for ${variant.level} reading level`}
        className={`px-4 py-2 bg-gradient-to-r ${colors} text-white rounded-lg disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 active:scale-95`}
      >
        {isPlaying ? "Playing..." : "▶ Play"}
      </button>

      {isPlaying && (
        <button
          onClick={stop}
          aria-label={`Stop audio for ${variant.level} reading level`}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 active:scale-95"
        >
          ⏹ Stop
        </button>
      )}

      {isPlaying && (
        <span className="text-sm text-slate-600 font-medium animate-pulse">
          ♪ Playing
        </span>
      )}

      {error && (
        <span className="text-sm text-red-600 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}

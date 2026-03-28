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

  if (!isAvailable) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        onClick={() => play(variant.text, language, variant.level)}
        disabled={isPlaying}
        aria-label={`Play audio for ${variant.level} reading level`}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
      >
        {isPlaying ? "Playing..." : "Play"}
      </button>

      {isPlaying && (
        <button
          onClick={stop}
          aria-label={`Stop audio for ${variant.level} reading level`}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium transition-colors"
        >
          Stop
        </button>
      )}

      {isPlaying && (
        <span className="text-sm text-blue-600 font-medium animate-pulse">
          ♪ Playing
        </span>
      )}

      {error && (
        <span className="text-sm text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}

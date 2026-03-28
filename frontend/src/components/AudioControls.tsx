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
    <div className="flex items-center gap-2">
      {isPlaying ? (
        <button
          onClick={stop}
          aria-label={`Stop audio for ${variant.level} reading level`}
          className="p-3 bg-surface-container rounded-xl text-on-surface hover:bg-primary hover:text-on-primary transition-all group/btn"
        >
          <span className="material-symbols-outlined">volume_up</span>
        </button>
      ) : (
        <button
          onClick={() => play(variant.text, language, variant.level)}
          aria-label={`Play audio for ${variant.level} reading level`}
          className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-xl text-on-surface font-bold text-sm hover:bg-surface-variant transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">play_circle</span>
          Listen
        </button>
      )}
      <button 
        onClick={() => navigator.clipboard.writeText(variant.text)}
        className="p-2.5 bg-surface-container rounded-xl text-on-surface hover:bg-surface-variant transition-all"
        aria-label="Copy text"
      >
        <span className="material-symbols-outlined text-[20px]">content_copy</span>
      </button>
    </div>
  );
}

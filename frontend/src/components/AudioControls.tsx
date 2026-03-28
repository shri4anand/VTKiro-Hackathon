import React from "react";
import { useTTS } from "../hooks/useTTS";
import { useAppState } from "../store/appState";
import { SimplifiedVariant, Language } from "../types";

interface AudioControlsProps {
  variant: SimplifiedVariant;
  language: Language;
}

export function AudioControls({ variant, language }: AudioControlsProps) {
  const { play, pause, isAvailable, error, isLoading } = useTTS();
  const state = useAppState();
  const isPlaying = state.playingLevel === variant.level;

  console.log("[AudioControls] Render:", {
    level: variant.level,
    isPlaying,
    isAvailable,
    isLoading,
    error,
    textLength: variant.text.length,
  });

  if (!isAvailable) {
    console.log("[AudioControls] TTS not available, hiding controls");
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isPlaying ? (
        <button
          onClick={() => {
            console.log("[AudioControls] Pause button clicked");
            pause();
          }}
          aria-label={`Pause audio for ${variant.level} reading level`}
          className="p-3 bg-surface-container rounded-xl text-on-surface hover:bg-primary hover:text-on-primary transition-all group/btn"
          disabled={isLoading}
        >
          <span className="material-symbols-outlined">pause</span>
        </button>
      ) : (
        <button
          onClick={() => {
            console.log("[AudioControls] Play button clicked:", { text: variant.text.substring(0, 50), language, level: variant.level });
            play(variant.text, language, variant.level);
          }}
          aria-label={`Play audio for ${variant.level} reading level`}
          className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-xl text-on-surface font-bold text-sm hover:bg-surface-variant transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              Loading...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">play_circle</span>
              Listen
            </>
          )}
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

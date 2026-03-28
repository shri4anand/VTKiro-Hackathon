import { useCallback, useRef, useEffect } from "react";
import { useAppState, useAppDispatch } from "../store/appState";
import { Language, ReadingLevel } from "../types";

interface UseTTSReturn {
  play: (text: string, language: Language, level: ReadingLevel) => void;
  stop: () => void;
  isAvailable: boolean;
  error: string | null;
}

// Map Language type to Web Speech API language codes
const languageMap: Record<Language, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  zh: "zh-CN",
  ar: "ar-SA",
  pt: "pt-BR",
};

export function useTTS(): UseTTSReturn {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const errorRef = useRef<string | null>(null);

  // Check if Web Speech API is available
  const isAvailable =
    typeof window !== "undefined" &&
    (window.speechSynthesis !== undefined ||
      (window as any).webkitSpeechSynthesis !== undefined);

  const play = useCallback(
    (text: string, language: Language, level: ReadingLevel) => {
      if (!isAvailable) {
        errorRef.current = "Speech synthesis is not available in this browser.";
        return;
      }

      // Stop any existing playback
      stop();

      try {
        const synth = window.speechSynthesis || (window as any).webkitSpeechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = languageMap[language];
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Set playingLevel when playback starts
        utterance.onstart = () => {
          dispatch({ type: "SET_PLAYING_LEVEL", payload: level });
          errorRef.current = null;
        };

        // Clear playingLevel when playback ends
        utterance.onend = () => {
          dispatch({ type: "SET_PLAYING_LEVEL", payload: null });
        };

        // Handle errors
        utterance.onerror = (event) => {
          const errorMessage = `Audio unavailable for this variant.`;
          errorRef.current = errorMessage;
          dispatch({ type: "SET_PLAYING_LEVEL", payload: null });
        };

        utteranceRef.current = utterance;
        synth.speak(utterance);
      } catch (err) {
        errorRef.current = "Audio unavailable for this variant.";
        dispatch({ type: "SET_PLAYING_LEVEL", payload: null });
      }
    },
    [isAvailable, dispatch]
  );

  const stop = useCallback(() => {
    if (!isAvailable) return;

    try {
      const synth = window.speechSynthesis || (window as any).webkitSpeechSynthesis;
      synth.cancel();
      dispatch({ type: "SET_PLAYING_LEVEL", payload: null });
      errorRef.current = null;
    } catch (err) {
      // Silently handle stop errors
    }
  }, [isAvailable, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    play,
    stop,
    isAvailable,
    error: errorRef.current,
  };
}

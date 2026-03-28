import { useCallback, useRef, useEffect } from "react";
import { useAppState, useAppDispatch } from "../store/appState";
import { Language, ReadingLevel } from "../types";

interface UseTTSReturn {
  play: (text: string, language: Language, level: ReadingLevel) => void;
  stop: () => void;
  skip: (seconds: number) => void;
  setSpeed: (speed: number) => void;
  speed: number;
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
  const currentTextRef = useRef<string>("");
  const currentLanguageRef = useRef<Language>("en");
  const currentLevelRef = useRef<ReadingLevel>("grade6");
  const speedRef = useRef<number>(1.0);

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

      // Store current playback info
      currentTextRef.current = text;
      currentLanguageRef.current = language;
      currentLevelRef.current = level;

      try {
        const synth = window.speechSynthesis || (window as any).webkitSpeechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = languageMap[language];
        utterance.rate = speedRef.current;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Set playingLevel when playback starts
        utterance.onstart = () => {
          dispatch({ type: "SET_PLAYING_LEVEL", payload: level });
          dispatch({ type: "SET_LAST_PLAYED_LEVEL", payload: level });
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

  const skip = useCallback((seconds: number) => {
    if (!isAvailable || !currentTextRef.current) return;

    const synth = window.speechSynthesis || (window as any).webkitSpeechSynthesis;
    
    // Get current position (approximate based on elapsed time)
    const text = currentTextRef.current;
    const words = text.split(/\s+/);
    const wordsPerSecond = 2.5; // Average speaking rate
    
    // Calculate approximate current word index
    const currentWordIndex = Math.floor(synth.speaking ? 
      (Date.now() - (utteranceRef.current as any)?.startTime || 0) / 1000 * wordsPerSecond : 0);
    
    // Calculate new position
    const skipWords = Math.floor(Math.abs(seconds) * wordsPerSecond);
    const newWordIndex = Math.max(0, Math.min(words.length - 1, 
      seconds > 0 ? currentWordIndex + skipWords : currentWordIndex - skipWords));
    
    // Create new text starting from new position
    const newText = words.slice(newWordIndex).join(" ");
    
    if (newText.trim()) {
      // Restart playback from new position
      play(newText, currentLanguageRef.current, currentLevelRef.current);
    }
  }, [isAvailable, play]);

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
    
    // If currently playing, restart with new speed
    if (state.playingLevel && currentTextRef.current) {
      play(currentTextRef.current, currentLanguageRef.current, currentLevelRef.current);
    }
  }, [state.playingLevel, play]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    play,
    stop,
    skip,
    setSpeed,
    speed: speedRef.current,
    isAvailable,
    error: errorRef.current,
  };
}

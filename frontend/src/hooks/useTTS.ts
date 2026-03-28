import { useCallback, useRef, useEffect, useState } from "react";
import { useAppDispatch } from "../store/appState";
import { Language, ReadingLevel } from "../types";

interface UseTTSReturn {
  play: (text: string, language: Language, level: ReadingLevel) => void;
  pause: () => void;
  stop: () => void;
  skip: (seconds: number) => void;
  setSpeed: (speed: number) => void;
  speed: number;
  isAvailable: boolean;
  error: string | null;
  isLoading: boolean;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001";

// Cache for storing generated audio URLs
const audioCache = new Map<string, string>();

function getCacheKey(text: string, language: Language): string {
  // Use first 100 chars + language as cache key
  return `${language}:${text.substring(0, 100)}`;
}

export function useTTS(): UseTTSReturn {
  const dispatch = useAppDispatch();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const currentCacheKeyRef = useRef<string>("");
  const speedRef = useRef<number>(1.0);

  const isAvailable = true;

  const pause = useCallback(() => {
    console.log("[useTTS] Pause called");
    if (!audioRef.current) return;

    try {
      audioRef.current.pause();
      console.log("[useTTS] Audio paused");
      dispatch({ type: "SET_PLAYING_LEVEL", payload: null });
    } catch (err) {
      console.error("[useTTS] ERROR in pause():", err);
    }
  }, [dispatch]);

  const stop = useCallback(() => {
    console.log("[useTTS] Stop called");
    if (!audioRef.current) return;

    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      console.log("[useTTS] Audio stopped and reset");
      dispatch({ type: "SET_PLAYING_LEVEL", payload: null });
      setError(null);
    } catch (err) {
      console.error("[useTTS] ERROR in stop():", err);
    }
  }, [dispatch]);

  const play = useCallback(
    async (text: string, language: Language, level: ReadingLevel) => {
      console.log("[useTTS] Play called:", { textLength: text.length, language, level });

      if (!isAvailable) {
        console.error("[useTTS] ERROR: TTS not available");
        setError("Speech synthesis is not available.");
        return;
      }

      const cacheKey = getCacheKey(text, language);

      // If we have an audio element for this exact content and it's paused, just resume
      if (audioRef.current && currentCacheKeyRef.current === cacheKey && audioRef.current.paused) {
        console.log("[useTTS] Resuming paused audio");
        try {
          await audioRef.current.play();
          dispatch({ type: "SET_PLAYING_LEVEL", payload: level });
          return;
        } catch (err) {
          console.error("[useTTS] ERROR resuming audio:", err);
          // Fall through to create new audio
        }
      }

      // Stop and cleanup any existing audio completely
      if (audioRef.current) {
        console.log("[useTTS] Cleaning up existing audio");
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = ""; // Clear the source to stop any loading
        audioRef.current.remove(); // Remove from DOM if attached
        audioRef.current = null;
      }

      try {
        let audioUrl = audioCache.get(cacheKey);

        // If not cached, fetch from backend
        if (!audioUrl) {
          console.log("[useTTS] Audio not cached, fetching from backend...");
          setIsLoading(true);

          const response = await fetch(`${API_BASE_URL}/api/tts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text, language }),
          });

          console.log("[useTTS] Backend response status:", response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "TTS request failed" }));
            console.error("[useTTS] ERROR: Backend returned error:", errorData);
            setIsLoading(false);
            throw new Error(errorData.error || "TTS request failed");
          }

          const data = await response.json();
          console.log("[useTTS] Received audio data, length:", data.audio?.length);

          // Create blob URL for better performance and caching
          const audioBlob = await fetch(`data:audio/mpeg;base64,${data.audio}`).then(r => r.blob());
          audioUrl = URL.createObjectURL(audioBlob);
          audioCache.set(cacheKey, audioUrl);
          console.log("[useTTS] Audio cached with key:", cacheKey);
        } else {
          console.log("[useTTS] Using cached audio");
        }

        // Create new audio element
        const audio = new Audio();
        audio.src = audioUrl;
        audio.playbackRate = speedRef.current;
        audio.preload = "auto";

        console.log("[useTTS] Created audio element, playback rate:", speedRef.current);

        audio.onloadeddata = () => {
          console.log("[useTTS] Audio loaded, duration:", audio.duration);
          setIsLoading(false);
        };

        audio.onplay = () => {
          console.log("[useTTS] Audio started playing");
          dispatch({ type: "SET_PLAYING_LEVEL", payload: level });
          dispatch({ type: "SET_LAST_PLAYED_LEVEL", payload: level });
          setError(null);
          setIsLoading(false);
        };

        audio.onpause = () => {
          console.log("[useTTS] Audio paused, currentTime:", audio.currentTime, "ended:", audio.ended);
          // Only clear playing level if audio ended or was reset to start
          if (audio.currentTime === 0 || audio.ended) {
            dispatch({ type: "SET_PLAYING_LEVEL", payload: null });
          }
        };

        audio.onended = () => {
          console.log("[useTTS] Audio ended");
          dispatch({ type: "SET_PLAYING_LEVEL", payload: null });
        };

        audio.onerror = (e) => {
          console.error("[useTTS] Audio element error:", e);
          const errorMessage = "Audio unavailable for this variant.";
          setError(errorMessage);
          dispatch({ type: "SET_PLAYING_LEVEL", payload: null });
          setIsLoading(false);
        };

        // Store reference and cache key BEFORE playing
        audioRef.current = audio;
        currentCacheKeyRef.current = cacheKey;
        
        console.log("[useTTS] Starting audio playback...");
        await audio.play();
        console.log("[useTTS] Audio play() called successfully");
      } catch (err) {
        console.error("[useTTS] ERROR: Exception in play():", err);
        setError(err instanceof Error ? err.message : "Audio unavailable for this variant.");
        dispatch({ type: "SET_PLAYING_LEVEL", payload: null });
        setIsLoading(false);
      }
    },
    [isAvailable, dispatch]
  );

  const skip = useCallback((seconds: number) => {
    console.log("[useTTS] Skip called:", seconds);
    if (!isAvailable || !audioRef.current) return;

    try {
      const audio = audioRef.current;
      const newTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
      console.log("[useTTS] Skipping from", audio.currentTime, "to", newTime);
      audio.currentTime = newTime;
    } catch (err) {
      console.error("[useTTS] ERROR in skip():", err);
    }
  }, [isAvailable]);

  const setSpeed = useCallback((speed: number) => {
    console.log("[useTTS] Set speed called:", speed);
    speedRef.current = speed;
    
    // If currently playing, update playback rate
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      console.log("[useTTS] Updated playback rate to:", speed);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  return {
    play,
    pause,
    stop,
    skip,
    setSpeed,
    speed: speedRef.current,
    isAvailable,
    error,
    isLoading,
  };
}

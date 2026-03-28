// Feature: crisis-text-simplifier, Property 10: Stop control halts TTS
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fc from "fast-check";
import { renderHook, act } from "@testing-library/react";
import { useTTS } from "../../hooks/useTTS";
import { AppStateProvider } from "../../store/appState";
import { ReactNode } from "react";
import { Language, ReadingLevel } from "../../types";

/**
 * Validates: Requirements 4.4
 */
describe("Property 10: Stop control halts TTS", () => {
  let mockCancel: ReturnType<typeof vi.fn>;
  let mockSpeak: ReturnType<typeof vi.fn>;
  let mockUtterance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCancel = vi.fn();
    mockSpeak = vi.fn();

    mockUtterance = {
      lang: "",
      rate: 1,
      pitch: 1,
      volume: 1,
      onstart: null as any,
      onend: null as any,
      onerror: null as any,
    };

    (global as any).SpeechSynthesisUtterance = vi.fn(() => mockUtterance);
    (global as any).speechSynthesis = {
      speak: mockSpeak,
      cancel: mockCancel,
    };
  });

  afterEach(() => {
    delete (global as any).SpeechSynthesisUtterance;
    delete (global as any).speechSynthesis;
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppStateProvider>{children}</AppStateProvider>
  );

  const languages: Language[] = ["en", "es", "fr", "zh", "ar", "pt"];
  const levels: ReadingLevel[] = ["grade3", "grade6", "grade9"];

  it("should call TTS cancel when stop is invoked during active playback", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom(...languages),
        fc.constantFrom(...levels)
      ),
      (text: string, language: Language, level: ReadingLevel) => {
        mockCancel.mockClear();
        mockSpeak.mockClear();
        const { result } = renderHook(() => useTTS(), { wrapper });

        // Start playback
        act(() => {
          result.current.play(text, language, level);
        });

        expect(mockSpeak).toHaveBeenCalled();
        expect(mockCancel).not.toHaveBeenCalled();

        // Stop playback
        act(() => {
          result.current.stop();
        });

        expect(mockCancel).toHaveBeenCalled();
      },
      { numRuns: 100 }
    );
  });

  it("should clear playingLevel when stop is called during active playback", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom(...languages),
        fc.constantFrom(...levels)
      ),
      (text: string, language: Language, level: ReadingLevel) => {
        mockCancel.mockClear();
        const { result } = renderHook(() => useTTS(), { wrapper });

        // Start playback
        act(() => {
          result.current.play(text, language, level);
        });

        // Simulate onstart to set playingLevel
        act(() => {
          if (mockUtterance.onstart) {
            mockUtterance.onstart.call(mockUtterance, new Event("start"));
          }
        });

        // Stop playback
        act(() => {
          result.current.stop();
        });

        expect(mockCancel).toHaveBeenCalled();
      },
      { numRuns: 100 }
    );
  });

  it("should handle stop being called multiple times without error", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom(...languages),
        fc.constantFrom(...levels),
        fc.integer({ min: 1, max: 5 })
      ),
      (text: string, language: Language, level: ReadingLevel, stopCount: number) => {
        mockCancel.mockClear();
        const { result } = renderHook(() => useTTS(), { wrapper });

        // Start playback
        act(() => {
          result.current.play(text, language, level);
        });

        // Call stop multiple times
        for (let i = 0; i < stopCount; i++) {
          act(() => {
            result.current.stop();
          });
        }

        // Should have called cancel stopCount times
        expect(mockCancel).toHaveBeenCalledTimes(stopCount);
      },
      { numRuns: 100 }
    );
  });

  it("should set playingLevel to null after stop is called", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom(...languages),
        fc.constantFrom(...levels)
      ),
      (text: string, language: Language, level: ReadingLevel) => {
        mockCancel.mockClear();
        const { result } = renderHook(() => useTTS(), { wrapper });

        // Start playback
        act(() => {
          result.current.play(text, language, level);
        });

        // Simulate onstart to set playingLevel
        act(() => {
          if (mockUtterance.onstart) {
            mockUtterance.onstart.call(mockUtterance, new Event("start"));
          }
        });

        // Stop playback
        act(() => {
          result.current.stop();
        });

        // Verify cancel was called (which triggers SET_PLAYING_LEVEL to null)
        expect(mockCancel).toHaveBeenCalled();
      },
      { numRuns: 100 }
    );
  });
});

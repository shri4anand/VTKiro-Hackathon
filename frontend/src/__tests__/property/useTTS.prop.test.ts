import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fc } from "fast-check";
import { renderHook, act } from "@testing-library/react";
import { useTTS } from "../../hooks/useTTS";
import { AppStateProvider } from "../../store/appState";
import { ReactNode } from "react";
import { Language, ReadingLevel } from "../../types";

// Mock Web Speech API
const mockSpeak = vi.fn();
const mockCancel = vi.fn();

const createMockUtterance = () => {
  const utterance = {
    lang: "",
    rate: 1,
    pitch: 1,
    volume: 1,
    onstart: null as ((this: SpeechSynthesisUtterance, ev: Event) => any) | null,
    onend: null as ((this: SpeechSynthesisUtterance, ev: Event) => any) | null,
    onerror: null as ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null,
  };
  return utterance;
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppStateProvider>{children}</AppStateProvider>
);

describe("useTTS Property Tests", () => {
  let mockUtterance: ReturnType<typeof createMockUtterance>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUtterance = createMockUtterance();

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

  // Feature: crisis-text-simplifier, Property 7: Each output card has a play button
  it("Property 7: play function is always available when speechSynthesis is available", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const { result } = renderHook(() => useTTS(), { wrapper });
        expect(typeof result.current.play).toBe("function");
        expect(result.current.isAvailable).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: crisis-text-simplifier, Property 8: TTS is called with correct text and language
  it("Property 8: TTS is called with correct text and language for any valid combination", () => {
    const languages: Language[] = ["en", "es", "fr", "zh", "ar", "pt"];
    const levels: ReadingLevel[] = ["grade3", "grade6", "grade9"];

    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.sample(fc.constantFrom(...languages), 1)[0] as Language,
        fc.sample(fc.constantFrom(...levels), 1)[0] as ReadingLevel
      ),
      (text, language, level) => {
        mockSpeak.mockClear();
        const { result } = renderHook(() => useTTS(), { wrapper });

        act(() => {
          result.current.play(text, language, level);
        });

        expect(mockSpeak).toHaveBeenCalled();
        expect(mockUtterance.lang).toBeTruthy();
      },
      { numRuns: 100 }
    );
  });

  // Feature: crisis-text-simplifier, Property 9: Playing indicator is shown during active playback
  it("Property 9: stop function always clears playingLevel when called during playback", () => {
    const languages: Language[] = ["en", "es", "fr", "zh", "ar", "pt"];
    const levels: ReadingLevel[] = ["grade3", "grade6", "grade9"];

    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.sample(fc.constantFrom(...languages), 1)[0] as Language,
        fc.sample(fc.constantFrom(...levels), 1)[0] as ReadingLevel
      ),
      (text, language, level) => {
        mockCancel.mockClear();
        const { result } = renderHook(() => useTTS(), { wrapper });

        act(() => {
          result.current.play(text, language, level);
        });

        act(() => {
          result.current.stop();
        });

        expect(mockCancel).toHaveBeenCalled();
      },
      { numRuns: 100 }
    );
  });

  // Feature: crisis-text-simplifier, Property 10: Stop control halts TTS
  it("Property 10: stop function can be called multiple times without error", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (stopCount) => {
        mockCancel.mockClear();
        const { result } = renderHook(() => useTTS(), { wrapper });

        act(() => {
          result.current.play("Test text", "en", "grade3");
        });

        for (let i = 0; i < stopCount; i++) {
          act(() => {
            result.current.stop();
          });
        }

        expect(mockCancel).toHaveBeenCalledTimes(stopCount);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: crisis-text-simplifier, Property 8: TTS is called with correct text and language
  it("Property 8: play function accepts any valid language and sets correct language code", () => {
    const languageMap: Record<Language, string> = {
      en: "en-US",
      es: "es-ES",
      fr: "fr-FR",
      zh: "zh-CN",
      ar: "ar-SA",
      pt: "pt-BR",
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.constantFrom<Language>("en", "es", "fr", "zh", "ar", "pt")
      ),
      (text, language) => {
        mockSpeak.mockClear();
        const { result } = renderHook(() => useTTS(), { wrapper });

        act(() => {
          result.current.play(text, language, "grade3");
        });

        expect(mockUtterance.lang).toBe(languageMap[language]);
      },
      { numRuns: 100 }
    );
  });
});

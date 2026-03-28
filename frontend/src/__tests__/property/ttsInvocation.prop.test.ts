// Feature: crisis-text-simplifier, Property 8: TTS is called with correct text and language
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fc from "fast-check";
import { renderHook, act } from "@testing-library/react";
import { useTTS } from "../../hooks/useTTS";
import { AppStateProvider } from "../../store/appState";
import { ReactNode } from "react";
import { Language, ReadingLevel } from "../../types";

/**
 * Validates: Requirements 4.2, 4.6
 */
describe("Property 8: TTS is called with correct text and language", () => {
  let mockSpeak: ReturnType<typeof vi.fn>;
  let mockUtterance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSpeak = vi.fn();

    mockUtterance = {
      lang: "",
      rate: 1,
      pitch: 1,
      volume: 1,
      onstart: null,
      onend: null,
      onerror: null,
    };

    (global as any).SpeechSynthesisUtterance = vi.fn(() => mockUtterance);
    (global as any).speechSynthesis = {
      speak: mockSpeak,
      cancel: vi.fn(),
    };
  });

  afterEach(() => {
    delete (global as any).SpeechSynthesisUtterance;
    delete (global as any).speechSynthesis;
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppStateProvider>{children}</AppStateProvider>
  );

  const languageMap: Record<Language, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    zh: "zh-CN",
    ar: "ar-SA",
    pt: "pt-BR",
  };

  it("should call TTS with correct text and language for any valid combination", () => {
    const languages: Language[] = ["en", "es", "fr", "zh", "ar", "pt"];
    const levels: ReadingLevel[] = ["grade3", "grade6", "grade9"];

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom<Language>(...languages),
        fc.constantFrom<ReadingLevel>(...levels)
      ),
      (text, language, level) => {
        mockSpeak.mockClear();
        const { result } = renderHook(() => useTTS(), { wrapper });

        act(() => {
          result.current.play(text, language, level);
        });

        // Assert TTS was called
        expect(mockSpeak).toHaveBeenCalled();

        // Assert the utterance was created with the correct text
        expect((global as any).SpeechSynthesisUtterance).toHaveBeenCalledWith(text);

        // Assert the language was set correctly
        expect(mockUtterance.lang).toBe(languageMap[language]);
      },
      { numRuns: 100 }
    );
  });

  it("should preserve text exactly as passed to TTS", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom<Language>("en", "es", "fr", "zh", "ar", "pt")
      ),
      (text, language) => {
        mockSpeak.mockClear();
        const { result } = renderHook(() => useTTS(), { wrapper });

        act(() => {
          result.current.play(text, language, "grade3");
        });

        // Verify the exact text was passed to SpeechSynthesisUtterance constructor
        const callArgs = (global as any).SpeechSynthesisUtterance.mock.calls[
          (global as any).SpeechSynthesisUtterance.mock.calls.length - 1
        ];
        expect(callArgs[0]).toBe(text);
      },
      { numRuns: 100 }
    );
  });

  it("should set correct language code for all supported languages", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
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

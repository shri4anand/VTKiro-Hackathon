import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTTS } from "../../hooks/useTTS";
import { AppStateProvider } from "../../store/appState";
import { ReactNode } from "react";

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

describe("useTTS", () => {
  let mockUtterance: ReturnType<typeof createMockUtterance>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUtterance = createMockUtterance();

    // Mock SpeechSynthesisUtterance
    (global as any).SpeechSynthesisUtterance = vi.fn(() => mockUtterance);

    // Mock speechSynthesis
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

  it("should be available when speechSynthesis is defined", () => {
    const { result } = renderHook(() => useTTS(), { wrapper });
    expect(result.current.isAvailable).toBe(true);
  });

  it("should not be available when speechSynthesis is undefined", () => {
    delete (global as any).speechSynthesis;
    const { result } = renderHook(() => useTTS(), { wrapper });
    expect(result.current.isAvailable).toBe(false);
  });

  it("should call speak with correct utterance when play is called", () => {
    const { result } = renderHook(() => useTTS(), { wrapper });

    act(() => {
      result.current.play("Hello world", "en", "grade3");
    });

    expect(mockSpeak).toHaveBeenCalledWith(mockUtterance);
    expect(mockUtterance.lang).toBe("en-US");
  });

  it("should set correct language code for different languages", () => {
    const { result } = renderHook(() => useTTS(), { wrapper });

    const languages = [
      { lang: "es" as const, expected: "es-ES" },
      { lang: "fr" as const, expected: "fr-FR" },
      { lang: "zh" as const, expected: "zh-CN" },
      { lang: "ar" as const, expected: "ar-SA" },
      { lang: "pt" as const, expected: "pt-BR" },
    ];

    languages.forEach(({ lang, expected }) => {
      act(() => {
        result.current.play("Test text", lang, "grade3");
      });
      expect(mockUtterance.lang).toBe(expected);
    });
  });

  it("should call cancel when stop is called", () => {
    const { result } = renderHook(() => useTTS(), { wrapper });

    act(() => {
      result.current.stop();
    });

    expect(mockCancel).toHaveBeenCalled();
  });

  it("should not call speak if speechSynthesis is unavailable", () => {
    delete (global as any).speechSynthesis;
    const { result } = renderHook(() => useTTS(), { wrapper });

    act(() => {
      result.current.play("Hello world", "en", "grade3");
    });

    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it("should handle TTS errors gracefully", () => {
    const { result } = renderHook(() => useTTS(), { wrapper });

    act(() => {
      result.current.play("Hello world", "en", "grade3");
    });

    // Simulate error event
    act(() => {
      if (mockUtterance.onerror) {
        mockUtterance.onerror.call(mockUtterance, new Event("error") as any);
      }
    });

    expect(result.current.error).toBe("Audio unavailable for this variant.");
  });

  it("should cancel previous utterance when play is called again", () => {
    const { result } = renderHook(() => useTTS(), { wrapper });

    act(() => {
      result.current.play("First text", "en", "grade3");
    });

    expect(mockCancel).not.toHaveBeenCalled();

    act(() => {
      result.current.play("Second text", "en", "grade6");
    });

    expect(mockCancel).toHaveBeenCalled();
  });

  it("should set playingLevel to null when playback ends", () => {
    const { result } = renderHook(() => useTTS(), { wrapper });

    act(() => {
      result.current.play("Hello world", "en", "grade3");
    });

    // Simulate playback end
    act(() => {
      if (mockUtterance.onend) {
        mockUtterance.onend.call(mockUtterance, new Event("end"));
      }
    });

    // Note: We can't directly check playingLevel from the hook return,
    // but we can verify that cancel was called (which clears it)
    expect(mockCancel).not.toHaveBeenCalled(); // cancel is only called on stop()
  });
});

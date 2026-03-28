import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";

// Mock fetch
global.fetch = vi.fn();

describe("App - Language Toggle Integration (Task 6.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock map events fetch
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/data/map-events.json") {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.reject(new Error(`Unexpected fetch to ${url}`));
    });
  });

  it("should dispatch SET_LANGUAGE when language toggle changes", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      variants: [
        { level: "grade3", text: "Simple text", fkScore: 3.2 },
        { level: "grade6", text: "Medium text", fkScore: 5.8 },
        { level: "grade9", text: "Complex text", fkScore: 8.4 },
      ],
    };

    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/data/map-events.json") {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockResponse,
      });
    });

    render(<App />);

    // Enter some text
    const textarea = screen.getByPlaceholderText("Paste emergency alert text here…");
    await user.type(textarea, "Test alert");

    // Submit
    const submitButton = screen.getByRole("button", { name: "Simplify alert text" });
    await user.click(submitButton);

    // Wait for the first simplification to complete
    await waitFor(() => {
      expect(screen.getByText("Simplified Versions")).toBeInTheDocument();
    });

    // Verify initial language is English
    const englishButton = screen.getByRole("button", { name: "Select English" });
    expect(englishButton).toHaveAttribute("aria-pressed", "true");

    // Change language to Spanish
    const spanishButton = screen.getByRole("button", { name: "Select Spanish" });
    await user.click(spanishButton);

    // Verify Spanish is now selected
    expect(spanishButton).toHaveAttribute("aria-pressed", "true");
    expect(englishButton).toHaveAttribute("aria-pressed", "false");

    // Verify that a new API call was made with the new language
    // The fetch should have been called at least 3 times (map events + initial simplify + language change)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    // Verify the third call (second simplify call) includes the new language
    const thirdCall = (global.fetch as any).mock.calls[2];
    const thirdCallBody = JSON.parse(thirdCall[1].body);
    expect(thirdCallBody.language).toBe("es");
  });

  it("should NOT re-trigger simplify if there are no existing variants", async () => {
    const user = userEvent.setup();

    render(<App />);

    // Wait for map events to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/data/map-events.json");
    });

    const initialCallCount = (global.fetch as any).mock.calls.length;

    // Change language without submitting any text
    const spanishButton = screen.getByRole("button", { name: "Select Spanish" });
    await user.click(spanishButton);

    // Verify that NO additional API call was made (since there are no variants yet)
    // Only the initial map events call should have been made
    expect(global.fetch).toHaveBeenCalledTimes(initialCallCount);
  });

  it("should preserve previous variants while loading new ones", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      variants: [
        { level: "grade3", text: "Simple text", fkScore: 3.2 },
        { level: "grade6", text: "Medium text", fkScore: 5.8 },
        { level: "grade9", text: "Complex text", fkScore: 8.4 },
      ],
    };

    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/data/map-events.json") {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockResponse,
      });
    });

    render(<App />);

    // Enter text and submit
    const textarea = screen.getByPlaceholderText("Paste emergency alert text here…");
    await user.type(textarea, "Test alert");
    const submitButton = screen.getByRole("button", { name: "Simplify alert text" });
    await user.click(submitButton);

    // Wait for first simplification
    await waitFor(() => {
      expect(screen.getByText("Simple text")).toBeInTheDocument();
    });

    // Change language
    const spanishButton = screen.getByRole("button", { name: "Select Spanish" });
    await user.click(spanishButton);

    // The previous variants should still be visible while loading
    // (This is handled by the useSimplify hook which preserves variants)
    expect(screen.getByText("Simple text")).toBeInTheDocument();
  });
});

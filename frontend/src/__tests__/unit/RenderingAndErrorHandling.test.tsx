import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";

// Mock fetch
global.fetch = vi.fn();

describe("Rendering and Error Handling (Task 6.10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering Tests - Known Alert Text", () => {
    it("should render correct output structure with all three variants displayed", async () => {
      const user = userEvent.setup();
      const mockResponse = {
        variants: [
          { level: "grade3", text: "Simple alert text", fkScore: 3.2 },
          { level: "grade6", text: "Medium alert text", fkScore: 5.8 },
          { level: "grade9", text: "Complex alert text", fkScore: 8.4 },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      render(<App />);

      // Enter known alert text
      const textarea = screen.getByPlaceholderText("Paste emergency alert text here…");
      await user.type(textarea, "Emergency evacuation alert");

      // Submit
      const submitButton = screen.getByRole("button", { name: "Simplify alert text" });
      await user.click(submitButton);

      // Wait for all three variants to be rendered
      await waitFor(() => {
        expect(screen.getByText("Simplified Versions")).toBeInTheDocument();
      });

      // Verify all three grade levels are displayed
      const grade3Badges = screen.getAllByText("Grade 3");
      const grade6Badges = screen.getAllByText("Grade 6");
      const grade9Badges = screen.getAllByText("Grade 9");
      
      // Each grade should appear at least once (in the card badge)
      expect(grade3Badges.length).toBeGreaterThan(0);
      expect(grade6Badges.length).toBeGreaterThan(0);
      expect(grade9Badges.length).toBeGreaterThan(0);

      // Verify all three variant texts are displayed
      expect(screen.getByText("Simple alert text")).toBeInTheDocument();
      expect(screen.getByText("Medium alert text")).toBeInTheDocument();
      expect(screen.getByText("Complex alert text")).toBeInTheDocument();

      // Verify FK scores are displayed (they're split across elements)
      expect(screen.getByText(/3\.2/)).toBeInTheDocument();
      expect(screen.getByText(/5\.8/)).toBeInTheDocument();
      expect(screen.getByText(/8\.4/)).toBeInTheDocument();
    });

    it("should display all three cards in a grid layout", async () => {
      const user = userEvent.setup();
      const mockResponse = {
        variants: [
          { level: "grade3", text: "Simple", fkScore: 3.0 },
          { level: "grade6", text: "Medium", fkScore: 6.0 },
          { level: "grade9", text: "Complex", fkScore: 9.0 },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      render(<App />);

      const textarea = screen.getByPlaceholderText("Paste emergency alert text here…");
      await user.type(textarea, "Test alert");
      await user.click(screen.getByRole("button", { name: "Simplify alert text" }));

      await waitFor(() => {
        expect(screen.getByText("Simplified Versions")).toBeInTheDocument();
      });

      // Verify all three cards are present by checking for the variant text
      expect(screen.getByText("Simple")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("Complex")).toBeInTheDocument();
    });
  });

  describe("Error Handling - LLM Unavailable", () => {
    it("should show error message in ARIA live region when LLM is unavailable", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "The simplification service is currently unavailable. Please try again.",
          code: "LLM_UNAVAILABLE",
        }),
      });

      render(<App />);

      const textarea = screen.getByPlaceholderText("Paste emergency alert text here…");
      await user.type(textarea, "Test alert");
      await user.click(screen.getByRole("button", { name: "Simplify alert text" }));

      // Wait for error message in ARIA live region
      await waitFor(() => {
        const liveRegion = screen.getByRole("status");
        expect(liveRegion.textContent).toContain("unavailable");
      });
    });

    it("should preserve input text when LLM is unavailable", async () => {
      const user = userEvent.setup();
      const testText = "Emergency alert text";

      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "Service unavailable.",
          code: "LLM_UNAVAILABLE",
        }),
      });

      render(<App />);

      const textarea = screen.getByPlaceholderText(
        "Paste emergency alert text here…"
      ) as HTMLTextAreaElement;
      await user.type(textarea, testText);
      await user.click(screen.getByRole("button", { name: "Simplify alert text" }));

      // Wait for error state
      await waitFor(() => {
        const liveRegion = screen.getByRole("status");
        expect(liveRegion.textContent).toContain("unavailable");
      });

      // Verify input text is preserved
      expect(textarea.value).toBe(testText);
    });
  });

  describe("Error Handling - Timeout", () => {
    it("should clear loading state on timeout", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "The request timed out. Please try again.",
          code: "TIMEOUT",
        }),
      });

      render(<App />);

      const textarea = screen.getByPlaceholderText("Paste emergency alert text here…");
      await user.type(textarea, "Test alert");
      await user.click(screen.getByRole("button", { name: "Simplify alert text" }));

      // Wait for timeout error in ARIA live region
      await waitFor(() => {
        const liveRegion = screen.getByRole("status");
        expect(liveRegion.textContent).toContain("timed out");
      });

      // Verify loading state is cleared (no loading message visible)
      expect(screen.queryByText("Simplifying text...")).not.toBeInTheDocument();
    });

    it("should show timeout error message", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "Request timed out.",
          code: "TIMEOUT",
        }),
      });

      render(<App />);

      const textarea = screen.getByPlaceholderText("Paste emergency alert text here…");
      await user.type(textarea, "Test alert");
      await user.click(screen.getByRole("button", { name: "Simplify alert text" }));

      // Wait for error message in ARIA live region
      await waitFor(() => {
        const liveRegion = screen.getByRole("status");
        expect(liveRegion.textContent).toContain("timed out");
      });
    });
  });

  describe("Error Handling - Malformed Response", () => {
    it("should handle malformed response gracefully", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          // Missing required 'variants' field
          invalid: "structure",
        }),
      });

      render(<App />);

      const textarea = screen.getByPlaceholderText("Paste emergency alert text here…");
      await user.type(textarea, "Test alert");
      await user.click(screen.getByRole("button", { name: "Simplify alert text" }));

      // The app should handle this gracefully - since the response doesn't have variants,
      // it won't render the output panel
      await waitFor(() => {
        // Verify that the output panel is not shown (no variants)
        expect(screen.queryByText("Simplified Versions")).not.toBeInTheDocument();
      });
    });

    it("should preserve input text on malformed response", async () => {
      const user = userEvent.setup();
      const testText = "Test alert";

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          // Malformed response
          invalid: "data",
        }),
      });

      render(<App />);

      const textarea = screen.getByPlaceholderText(
        "Paste emergency alert text here…"
      ) as HTMLTextAreaElement;
      await user.type(textarea, testText);
      await user.click(screen.getByRole("button", { name: "Simplify alert text" }));

      // Wait a bit for processing
      await waitFor(() => {
        expect(textarea.value).toBe(testText);
      });
    });
  });

  describe("Language Toggle Tests", () => {
    it("should trigger new API call when language is changed", async () => {
      const user = userEvent.setup();
      const mockResponse = {
        variants: [
          { level: "grade3", text: "Simple text", fkScore: 3.2 },
          { level: "grade6", text: "Medium text", fkScore: 5.8 },
          { level: "grade9", text: "Complex text", fkScore: 8.4 },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      render(<App />);

      // Enter text and submit
      const textarea = screen.getByPlaceholderText("Paste emergency alert text here…");
      await user.type(textarea, "Test alert");
      await user.click(screen.getByRole("button", { name: "Simplify alert text" }));

      // Wait for first simplification
      await waitFor(() => {
        expect(screen.getByText("Simplified Versions")).toBeInTheDocument();
      });

      // Verify first API call was made
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Change language to Spanish
      const spanishButton = screen.getByRole("button", { name: "Select Spanish" });
      await user.click(spanishButton);

      // Wait for second API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it("should pass correct language parameter in API call", async () => {
      const user = userEvent.setup();
      const mockResponse = {
        variants: [
          { level: "grade3", text: "Simple text", fkScore: 3.2 },
          { level: "grade6", text: "Medium text", fkScore: 5.8 },
          { level: "grade9", text: "Complex text", fkScore: 8.4 },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      render(<App />);

      // Enter text and submit
      const textarea = screen.getByPlaceholderText("Paste emergency alert text here…");
      await user.type(textarea, "Test alert");
      await user.click(screen.getByRole("button", { name: "Simplify alert text" }));

      await waitFor(() => {
        expect(screen.getByText("Simplified Versions")).toBeInTheDocument();
      });

      // Change language to French
      const frenchButton = screen.getByRole("button", { name: "Select French" });
      await user.click(frenchButton);

      // Wait for API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      // Verify the second call includes the correct language
      const secondCall = (global.fetch as any).mock.calls[1];
      const secondCallBody = JSON.parse(secondCall[1].body);
      expect(secondCallBody.language).toBe("fr");
    });

    it("should update all displayed variants when language changes", async () => {
      const user = userEvent.setup();
      const englishResponse = {
        variants: [
          { level: "grade3", text: "English simple", fkScore: 3.2 },
          { level: "grade6", text: "English medium", fkScore: 5.8 },
          { level: "grade9", text: "English complex", fkScore: 8.4 },
        ],
      };

      const spanishResponse = {
        variants: [
          { level: "grade3", text: "Español simple", fkScore: 3.1 },
          { level: "grade6", text: "Español medio", fkScore: 5.9 },
          { level: "grade9", text: "Español complejo", fkScore: 8.3 },
        ],
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => englishResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => spanishResponse,
        });

      render(<App />);

      // Enter text and submit
      const textarea = screen.getByPlaceholderText("Paste emergency alert text here…");
      await user.type(textarea, "Test alert");
      await user.click(screen.getByRole("button", { name: "Simplify alert text" }));

      // Wait for English variants
      await waitFor(() => {
        expect(screen.getByText("English simple")).toBeInTheDocument();
      });

      // Change language to Spanish
      const spanishButton = screen.getByRole("button", { name: "Select Spanish" });
      await user.click(spanishButton);

      // Wait for Spanish variants to appear
      await waitFor(() => {
        expect(screen.getByText("Español simple")).toBeInTheDocument();
      });

      // Verify all Spanish variants are displayed
      expect(screen.getByText("Español medio")).toBeInTheDocument();
      expect(screen.getByText("Español complejo")).toBeInTheDocument();
    });

    it("should not trigger API call when language changes without existing variants", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          variants: [
            { level: "grade3", text: "Simple", fkScore: 3.0 },
            { level: "grade6", text: "Medium", fkScore: 6.0 },
            { level: "grade9", text: "Complex", fkScore: 9.0 },
          ],
        }),
      });

      render(<App />);

      // Change language without submitting any text
      const spanishButton = screen.getByRole("button", { name: "Select Spanish" });
      await user.click(spanishButton);

      // Verify no API call was made
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should maintain selected language after error", async () => {
      const user = userEvent.setup();

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: "Service unavailable.",
            code: "LLM_UNAVAILABLE",
          }),
        });

      render(<App />);

      // Enter text and submit
      const textarea = screen.getByPlaceholderText("Paste emergency alert text here…");
      await user.type(textarea, "Test alert");
      await user.click(screen.getByRole("button", { name: "Simplify alert text" }));

      // Wait for error state
      await waitFor(() => {
        const liveRegion = screen.getByRole("status");
        expect(liveRegion.textContent).toContain("unavailable");
      });

      // Change language to Spanish
      const spanishButton = screen.getByRole("button", { name: "Select Spanish" });
      await user.click(spanishButton);

      // Verify Spanish is selected
      expect(spanishButton).toHaveAttribute("aria-pressed", "true");
    });
  });
});

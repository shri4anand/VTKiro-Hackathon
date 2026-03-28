import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { ReactNode, useEffect } from "react";
import { StatusRegion } from "../../components/StatusRegion";
import { SimplifiedVariant, AppError } from "../../types";
import { AppStateProvider, useAppDispatch } from "../../store/appState";

// Feature: crisis-text-simplifier, Property 12: ARIA live region reflects loading and success states
// **Validates: Requirements 5.5, 5.6**

// Component to set up the test state
const TestStateSetup = ({
  children,
  status,
  variants,
  error,
}: {
  children: ReactNode;
  status: "idle" | "loading" | "success" | "error";
  variants?: SimplifiedVariant[] | null;
  error?: AppError | null;
}) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch({
      type: "SET_STATUS",
      payload: status,
    });

    if (variants !== undefined) {
      dispatch({
        type: "SET_VARIANTS",
        payload: variants,
      });
    }

    if (error !== undefined) {
      dispatch({
        type: "SET_ERROR",
        payload: error,
      });
    }
  }, [status, variants, error, dispatch]);

  return <>{children}</>;
};

// Wrapper component that sets up the app state
const TestWrapper = ({
  children,
  status,
  variants,
  error,
}: {
  children: ReactNode;
  status: "idle" | "loading" | "success" | "error";
  variants?: SimplifiedVariant[] | null;
  error?: AppError | null;
}) => {
  return (
    <AppStateProvider>
      <TestStateSetup status={status} variants={variants} error={error}>
        {children}
      </TestStateSetup>
    </AppStateProvider>
  );
};

describe("StatusRegion - Property 12: ARIA live region reflects loading and success states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should announce loading state to screen readers", async () => {
    render(
      <TestWrapper status="loading">
        <StatusRegion />
      </TestWrapper>
    );

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");

    await waitFor(() => {
      expect(liveRegion.textContent).toBe("Simplifying text, please wait.");
    });
  });

  it("should announce success state to screen readers", async () => {
    const variants: SimplifiedVariant[] = [
      { level: "grade3", text: "Simple text.", fkScore: 3.0 },
      { level: "grade6", text: "Medium text.", fkScore: 5.5 },
      { level: "grade9", text: "Complex text.", fkScore: 8.5 },
    ];

    render(
      <TestWrapper status="success" variants={variants}>
        <StatusRegion />
      </TestWrapper>
    );

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toBeInTheDocument();

    await waitFor(() => {
      expect(liveRegion.textContent).toBe(
        "Simplified text is ready. Three reading level variants are now available."
      );
    });
  });

  it("should announce error state to screen readers", async () => {
    const error: AppError = {
      error: "The simplification service is currently unavailable.",
      code: "LLM_UNAVAILABLE",
    };

    render(
      <TestWrapper status="error" error={error}>
        <StatusRegion />
      </TestWrapper>
    );

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toBeInTheDocument();

    await waitFor(() => {
      expect(liveRegion.textContent).toContain(
        "Error: The simplification service is currently unavailable."
      );
    });
  });

  it("should have empty announcement in idle state", () => {
    render(
      <TestWrapper status="idle">
        <StatusRegion />
      </TestWrapper>
    );

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion.textContent).toBe("");
  });

  it("should have aria-live and aria-atomic attributes for accessibility", () => {
    render(
      <TestWrapper status="loading">
        <StatusRegion />
      </TestWrapper>
    );

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
  });

  it("should update announcement when status transitions from loading to success", async () => {
    const variants: SimplifiedVariant[] = [
      { level: "grade3", text: "Simple.", fkScore: 3.0 },
      { level: "grade6", text: "Medium.", fkScore: 5.5 },
      { level: "grade9", text: "Complex.", fkScore: 8.5 },
    ];

    const { rerender } = render(
      <TestWrapper status="loading">
        <StatusRegion />
      </TestWrapper>
    );

    const liveRegion = screen.getByRole("status");

    await waitFor(() => {
      expect(liveRegion.textContent).toBe("Simplifying text, please wait.");
    });

    // Transition to success
    rerender(
      <TestWrapper status="success" variants={variants}>
        <StatusRegion />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(liveRegion.textContent).toBe(
        "Simplified text is ready. Three reading level variants are now available."
      );
    });
  });

  it("should have non-empty announcement for any loading or success state", () => {
    // Property-based test: for any loading or success state,
    // the ARIA live region should contain a non-empty announcement
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("loading"),
          fc.record({
            status: fc.constant("success"),
            grade3Text: fc.string({ minLength: 5, maxLength: 50 }),
            grade6Text: fc.string({ minLength: 5, maxLength: 50 }),
            grade9Text: fc.string({ minLength: 5, maxLength: 50 }),
            grade3Score: fc.float({ min: 0.1, max: 4.0 }),
            grade6Score: fc.float({ min: 4.1, max: 7.0 }),
            grade9Score: fc.float({ min: 7.1, max: 10.0 }),
          })
        ),
        (stateData) => {
          let status: "loading" | "success";
          let variants: SimplifiedVariant[] | undefined;

          if (typeof stateData === "string") {
            status = stateData as "loading";
          } else {
            status = stateData.status as "success";
            variants = [
              { level: "grade3", text: stateData.grade3Text, fkScore: stateData.grade3Score },
              { level: "grade6", text: stateData.grade6Text, fkScore: stateData.grade6Score },
              { level: "grade9", text: stateData.grade9Text, fkScore: stateData.grade9Score },
            ];
          }

          const { unmount } = render(
            <TestWrapper status={status} variants={variants}>
              <StatusRegion />
            </TestWrapper>
          );

          const liveRegion = screen.getByRole("status");

          // Assert: ARIA live region exists
          expect(liveRegion).toBeInTheDocument();

          // Assert: ARIA live region has correct attributes
          expect(liveRegion).toHaveAttribute("aria-live", "polite");
          expect(liveRegion).toHaveAttribute("aria-atomic", "true");

          // Assert: For loading or success states, announcement is non-empty
          expect(liveRegion.textContent).not.toBe("");
          expect(liveRegion.textContent?.length).toBeGreaterThan(0);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should announce different error messages for different error codes", async () => {
    const errorCodes: Array<AppError["code"]> = [
      "LLM_UNAVAILABLE",
      "TIMEOUT",
      "MALFORMED_RESPONSE",
      "VALIDATION_ERROR",
    ];

    for (const code of errorCodes) {
      const error: AppError = {
        error: `Error with code ${code}`,
        code,
      };

      const { unmount } = render(
        <TestWrapper status="error" error={error}>
          <StatusRegion />
        </TestWrapper>
      );

      const liveRegion = screen.getByRole("status");

      await waitFor(() => {
        expect(liveRegion.textContent).toContain(`Error: Error with code ${code}`);
      });

      unmount();
    }
  });

  it("should maintain sr-only class for visual hiding while keeping accessibility", () => {
    render(
      <TestWrapper status="loading">
        <StatusRegion />
      </TestWrapper>
    );

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveClass("sr-only");
  });

  it("should update announcement when variants change in success state", async () => {
    const variants1: SimplifiedVariant[] = [
      { level: "grade3", text: "Simple.", fkScore: 3.0 },
      { level: "grade6", text: "Medium.", fkScore: 5.5 },
      { level: "grade9", text: "Complex.", fkScore: 8.5 },
    ];

    const variants2: SimplifiedVariant[] = [
      { level: "grade3", text: "Simpler.", fkScore: 2.5 },
      { level: "grade6", text: "Moderate.", fkScore: 5.0 },
      { level: "grade9", text: "Complicated.", fkScore: 9.0 },
    ];

    const { rerender } = render(
      <TestWrapper status="success" variants={variants1}>
        <StatusRegion />
      </TestWrapper>
    );

    const liveRegion = screen.getByRole("status");

    await waitFor(() => {
      expect(liveRegion.textContent).toBe(
        "Simplified text is ready. Three reading level variants are now available."
      );
    });

    // Update variants
    rerender(
      <TestWrapper status="success" variants={variants2}>
        <StatusRegion />
      </TestWrapper>
    );

    // Announcement should remain the same (it's about success state, not specific variants)
    expect(liveRegion.textContent).toBe(
      "Simplified text is ready. Three reading level variants are now available."
    );
  });
});

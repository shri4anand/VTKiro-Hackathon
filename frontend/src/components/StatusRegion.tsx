import React from "react";
import { useAppState } from "../store/appState";

/**
 * StatusRegion component
 * 
 * Announces loading and success state transitions to screen readers via ARIA live region.
 * This component is invisible but provides critical accessibility announcements.
 * 
 * Validates: Requirements 5.5, 5.6
 */
export function StatusRegion() {
  const state = useAppState();

  // Determine the announcement message based on current status
  const getAnnouncement = (): string => {
    if (state.status === "loading") {
      return "Simplifying text, please wait.";
    }
    if (state.status === "success" && state.variants && state.variants.length > 0) {
      return "Simplified text is ready. Three reading level variants are now available.";
    }
    if (state.status === "error" && state.error) {
      return `Error: ${state.error.error}`;
    }
    return "";
  };

  const announcement = getAnnouncement();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

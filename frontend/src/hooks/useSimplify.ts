import { useCallback } from "react";
import { useAppState, useAppDispatch } from "../store/appState";
import { SimplifyResponse, AppError } from "../types";
import { API_BASE_URL } from "../config";

export function useSimplify() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const simplify = useCallback(async () => {
    const { inputText, language } = state;

    // Set loading state
    dispatch({ type: "SET_STATUS", payload: "loading" });
    dispatch({ type: "SET_ERROR", payload: null });

    // Create AbortController with 15-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/simplify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          language,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: AppError = await response.json();
        dispatch({ type: "SET_STATUS", payload: "error" });
        dispatch({ type: "SET_ERROR", payload: errorData });
        // Preserve inputText - no action needed as it's already in state
        return;
      }

      const data: SimplifyResponse = await response.json();
      dispatch({ type: "SET_STATUS", payload: "success" });
      dispatch({ type: "SET_VARIANTS", payload: data.variants });
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        dispatch({ type: "SET_STATUS", payload: "error" });
        dispatch({
          type: "SET_ERROR",
          payload: {
            error: "The request timed out. Please try again.",
            code: "TIMEOUT",
          },
        });
        // Preserve inputText - no action needed as it's already in state
        return;
      }

      // Handle network or other errors
      dispatch({ type: "SET_STATUS", payload: "error" });
      dispatch({
        type: "SET_ERROR",
        payload: {
          error: "The simplification service is currently unavailable. Please try again.",
          code: "LLM_UNAVAILABLE",
        },
      });
      // Preserve inputText - no action needed as it's already in state
    }
  }, [state, dispatch]);

  return {
    simplify,
    status: state.status,
    variants: state.variants,
    error: state.error,
  };
}

import { useEffect, useRef } from "react";
import { useAppState, useAppDispatch } from "../store/appState";
import { FeedResponse, FeedError } from "../types";

export function useFeedPoller() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pollFeed = async () => {
    dispatch({ type: "SET_IS_POLLING", payload: true });

    try {
      const response = await fetch("/api/feed");

      if (!response.ok) {
        const errorData: FeedError = await response.json();
        dispatch({ type: "SET_FEED_ERROR", payload: errorData });

        // Auto-dismiss error after 10 seconds
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
        errorTimeoutRef.current = setTimeout(() => {
          dispatch({ type: "SET_FEED_ERROR", payload: null });
        }, 10000);

        dispatch({ type: "SET_IS_POLLING", payload: false });
        return;
      }

      const data: FeedResponse = await response.json();

      // Prepend new items to existing items
      const updatedItems = [...data.items, ...state.feed.items];
      dispatch({ type: "SET_FEED_ITEMS", payload: updatedItems });

      // Clear any existing error
      dispatch({ type: "SET_FEED_ERROR", payload: null });
      dispatch({ type: "SET_IS_POLLING", payload: false });
    } catch (error) {
      // Handle network or other errors
      const feedError: FeedError = {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch feed. Please try again.",
        code: "NEWS_SOURCE_UNAVAILABLE",
      };

      dispatch({ type: "SET_FEED_ERROR", payload: feedError });

      // Auto-dismiss error after 10 seconds
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        dispatch({ type: "SET_FEED_ERROR", payload: null });
      }, 10000);

      dispatch({ type: "SET_IS_POLLING", payload: false });
    }
  };

  useEffect(() => {
    // Poll immediately on mount
    pollFeed();

    // Set up interval for polling every 5 minutes (300,000 ms)
    intervalIdRef.current = setInterval(() => {
      pollFeed();
    }, 300000);

    // Cleanup on unmount
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  return {
    items: state.feed.items,
    isPolling: state.feed.isPolling,
    feedError: state.feed.feedError,
  };
}

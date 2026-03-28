import React, { useEffect } from "react";
import { useAppState, useAppDispatch } from "../store/appState";
import { FeedStatusBar } from "./FeedStatusBar";
import { FeedItem } from "./FeedItem";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function FeedPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initial poll on mount
    const pollFeed = async () => {
      dispatch({ type: "SET_IS_POLLING", payload: true });
      try {
        const response = await fetch("/api/feed", {
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          const errorData = await response.json();
          dispatch({
            type: "SET_FEED_ERROR",
            payload: errorData,
          });
          return;
        }

        const data = await response.json();
        dispatch({
          type: "SET_FEED_ITEMS",
          payload: [...data.items, ...state.feed.items],
        });
        dispatch({ type: "SET_FEED_ERROR", payload: null });
      } catch (error) {
        dispatch({
          type: "SET_FEED_ERROR",
          payload: {
            error:
              error instanceof Error && error.name === "AbortError"
                ? "Feed refresh timed out. Will retry in 5 minutes."
                : "Could not refresh the feed. Will retry in 5 minutes.",
            code: "TIMEOUT",
          },
        });
      } finally {
        dispatch({ type: "SET_IS_POLLING", payload: false });
      }
    };

    // Poll immediately on mount
    pollFeed();

    // Set up interval for subsequent polls
    const intervalId = setInterval(pollFeed, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [dispatch, state.feed.items]);

  return (
    <section className="mt-8" aria-label="Crisis news feed">
      <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1 h-8 bg-gradient-to-b from-warm-500 to-warm-600 rounded-full"></span>
        Crisis Feed
      </h2>

      <FeedStatusBar
        isPolling={state.feed.isPolling}
        feedError={state.feed.feedError}
      />

      <div className="mt-6 space-y-4">
        {state.feed.items.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <p>No articles available yet. Check back soon.</p>
          </div>
        ) : (
          state.feed.items.map((item) => (
            <FeedItem
              key={item.id}
              item={item}
              activeLevel={state.activeLevel}
            />
          ))
        )}
      </div>
    </section>
  );
}

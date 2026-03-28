import React, { useEffect } from "react";
import { useAppState, useAppDispatch } from "../store/appState";
import { FeedStatusBar } from "./FeedStatusBar";
import { FeedItem } from "./FeedItem";
import { API_BASE_URL } from "../config";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function FeedPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const pollFeed = async () => {
      dispatch({ type: "SET_IS_POLLING", payload: true });
      try {
        const response = await fetch(`${API_BASE_URL}/api/feed`, {
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

    pollFeed();
    const intervalId = setInterval(pollFeed, POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [dispatch, state.feed.items]);

  return (
    <aside className="flex-[1.2] bg-surface-container-low border-l border-surface-variant flex flex-col min-w-[400px] max-h-screen" aria-label="Crisis news feed">
      <div className="p-6 border-b border-surface-variant flex items-center justify-between bg-surface-container-low/80 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-on-surface text-xl font-black tracking-tight">Live Crisis Feed</h2>
        <FeedStatusBar isPolling={state.feed.isPolling} feedError={state.feed.feedError} />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {state.feed.items.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
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
    </aside>
  );
}

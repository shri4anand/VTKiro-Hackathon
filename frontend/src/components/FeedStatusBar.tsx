import React, { useEffect, useState } from "react";
import { FeedError } from "../types";

interface FeedStatusBarProps {
  isPolling: boolean;
  feedError: FeedError | null;
}

export function FeedStatusBar({ isPolling, feedError }: FeedStatusBarProps) {
  const [showError, setShowError] = useState(!!feedError);

  useEffect(() => {
    if (feedError) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [feedError]);

  return (
    <div className="space-y-2">
      {isPolling && (
        <div
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg"
          role="status"
          aria-label="Feed is refreshing"
        >
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
          </div>
          <span className="text-sm text-blue-700 font-medium">Refreshing feed...</span>
        </div>
      )}

      {showError && feedError && (
        <div
          className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm text-amber-800">
            {feedError.error}
          </p>
        </div>
      )}
    </div>
  );
}

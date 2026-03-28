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
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg shadow-sm"
          role="status"
          aria-label="Feed is refreshing"
        >
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
          </div>
          <span className="text-sm text-primary-700 font-medium">Refreshing feed...</span>
        </div>
      )}

      {showError && feedError && (
        <div
          className="px-4 py-3 bg-gradient-to-r from-warm-50 to-orange-50 border border-warm-200 rounded-lg shadow-sm"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm text-warm-800 font-medium">
            {feedError.error}
          </p>
        </div>
      )}
    </div>
  );
}

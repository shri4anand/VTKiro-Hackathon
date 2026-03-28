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

  if (feedError && showError) {
    return (
      <div className="flex items-center gap-2 text-error font-bold text-[10px] uppercase tracking-[0.2em]" role="alert" aria-live="polite">
        <div className="size-1.5 bg-error rounded-full"></div>
        Error
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]" role="status" aria-label={isPolling ? "Feed is refreshing" : "Feed ready"}>
      <div className={`size-1.5 bg-primary rounded-full ${isPolling ? "animate-ping" : ""}`}></div>
      {isPolling ? "Refreshing..." : "Live"}
    </div>
  );
}

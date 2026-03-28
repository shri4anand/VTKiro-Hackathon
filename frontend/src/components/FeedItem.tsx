import React from "react";
import { FeedItem as FeedItemType, ReadingLevel } from "../types";

interface FeedItemProps {
  item: FeedItemType;
  activeLevel: ReadingLevel;
}

export function FeedItem({ item, activeLevel }: FeedItemProps) {
  const variant = item.variants.find((v) => v.level === activeLevel);

  if (!variant) {
    return null;
  }

  const publishedDate = new Date(item.publishedAt);
  const formattedDate = publishedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {item.title}
        </h3>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="font-medium">{item.source}</span>
          <span>•</span>
          <time dateTime={item.publishedAt}>{formattedDate}</time>
        </div>
      </div>

      <p className="text-gray-800 leading-relaxed mb-3">
        {variant.text}
      </p>

      <div className="flex items-center justify-between">
        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
          {activeLevel === "grade3" && "Grade 3"}
          {activeLevel === "grade6" && "Grade 6"}
          {activeLevel === "grade9" && "Grade 9"}
        </span>
        <span className="text-xs text-gray-600">
          FK Score: {variant.fkScore.toFixed(1)}
        </span>
      </div>
    </article>
  );
}

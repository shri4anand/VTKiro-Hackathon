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

  const levelColors: Record<ReadingLevel, { bg: string; border: string; badge: string }> = {
    grade3: {
      bg: "from-emerald-50 to-teal-50",
      border: "border-l-4 border-emerald-500",
      badge: "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 border border-emerald-200"
    },
    grade6: {
      bg: "from-blue-50 to-cyan-50",
      border: "border-l-4 border-blue-500",
      badge: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200"
    },
    grade9: {
      bg: "from-purple-50 to-indigo-50",
      border: "border-l-4 border-purple-500",
      badge: "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200"
    },
  };

  const colors = levelColors[activeLevel];

  return (
    <article className={`bg-gradient-to-br ${colors.bg} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 ${colors.border} border-b border-r border-slate-100`}>
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {item.title}
        </h3>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="font-medium">{item.source}</span>
          <span>•</span>
          <time dateTime={item.publishedAt}>{formattedDate}</time>
        </div>
      </div>

      <p className="text-slate-800 leading-relaxed mb-4">
        {variant.text}
      </p>

      <div className="flex items-center justify-between">
        <span className={`inline-block ${colors.badge} px-3 py-1 rounded-full text-xs font-semibold`}>
          {activeLevel === "grade3" && "Grade 3"}
          {activeLevel === "grade6" && "Grade 6"}
          {activeLevel === "grade9" && "Grade 9"}
        </span>
        <span className="text-xs text-slate-600 font-medium">
          FK Score: {variant.fkScore.toFixed(1)}
        </span>
      </div>
    </article>
  );
}

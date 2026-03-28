import React, { useState } from "react";
import { FeedItem as FeedItemType, ReadingLevel } from "../types";

interface FeedItemProps {
  item: FeedItemType;
  activeLevel: ReadingLevel;
}

const categoryColors = [
  { border: "border-secondary", badge: "text-secondary", label: "Active Warning" },
  { border: "border-tertiary", badge: "text-tertiary", label: "Utility Update" },
  { border: "border-outline", badge: "text-on-surface-variant", label: "Weather Advisory" },
  { border: "border-secondary", badge: "text-secondary", label: "Health Notice" },
];

export function FeedItem({ item, activeLevel }: FeedItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const variant = item.variants.find((v) => v.level === activeLevel);

  if (!variant) {
    return null;
  }

  const publishedDate = new Date(item.publishedAt);
  const now = new Date();
  const diffMs = now.getTime() - publishedDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  const timeAgo = diffMins < 60 ? `${diffMins}m ago` : `${diffHours}h ago`;

  // Cycle through categories based on item index
  const categoryIndex = parseInt(item.id.slice(-1), 16) % categoryColors.length;
  const category = categoryColors[categoryIndex];

  return (
    <article className={`bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-3 border-l-4 ${category.border} transition-all hover:shadow-md`}>
      <div className="flex justify-between items-center">
        <span className={`text-[10px] font-black uppercase ${category.badge} tracking-widest`}>
          {category.label}
        </span>
        <span className="text-[10px] text-on-surface-variant font-bold">{timeAgo}</span>
      </div>
      
      <h3 className="text-on-surface font-bold leading-tight text-base">{item.title}</h3>
      
      <details className="group" open={isOpen} onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer">
          <p className="text-on-surface-variant text-sm leading-relaxed content-preview">
            {variant.text}
          </p>
          <button 
            type="button"
            className="read-more-btn mt-2 text-[10px] font-black uppercase text-primary flex items-center gap-1 hover:underline"
          >
            Read More <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </button>
        </summary>
        <div className="mt-2 text-on-surface-variant text-sm leading-relaxed animate-in fade-in slide-in-from-top-1 duration-300">
          {variant.text}
          <button 
            type="button"
            className="mt-2 text-[10px] font-black uppercase text-on-surface-variant flex items-center gap-1 hover:underline"
            onClick={() => setIsOpen(false)}
          >
            Show Less <span className="material-symbols-outlined text-[14px]">expand_less</span>
          </button>
        </div>
      </details>
      
      <div className="flex items-center gap-2 pt-2">
        <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded">
          {activeLevel === "grade3" && "G3 Simplified"}
          {activeLevel === "grade6" && "G6 Simplified"}
          {activeLevel === "grade9" && "G9 Simplified"}
        </span>
      </div>
    </article>
  );
}

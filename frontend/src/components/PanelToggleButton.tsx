import React from 'react';

interface PanelToggleButtonProps {
  isMinimized: boolean;
  onClick: () => void;
  panelName: string;
}

export const PanelToggleButton: React.FC<PanelToggleButtonProps> = ({
  isMinimized,
  onClick,
  panelName,
}) => {
  const ariaLabel = isMinimized
    ? `Maximize ${panelName} panel`
    : `Minimize ${panelName} panel`;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors duration-200 motion-reduce:transition-none"
    >
      {isMinimized ? (
        // ChevronRight icon for maximize action
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      ) : (
        // ChevronLeft icon for minimize action
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      )}
    </button>
  );
};

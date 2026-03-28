import React from 'react';
import { PanelToggleButton } from './PanelToggleButton';

interface FeedPanelWrapperProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  children: React.ReactNode;
}

export const FeedPanelWrapper: React.FC<FeedPanelWrapperProps> = ({
  isMinimized,
  onToggleMinimize,
  children,
}) => {
  return (
    <div
      className={`absolute top-4 right-4 max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-lg shadow-lg z-10 transition-all duration-300 ease-in-out ${
        isMinimized ? 'w-12' : 'w-64'
      }`}
      aria-expanded={!isMinimized}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4">
        <h2
          className={`font-bold text-gray-900 ${
            isMinimized ? 'text-sm' : 'text-xl'
          }`}
          style={isMinimized ? { writingMode: 'vertical-rl' } : undefined}
        >
          Crisis Feed
        </h2>
        <PanelToggleButton
          isMinimized={isMinimized}
          onClick={onToggleMinimize}
          panelName="Feed"
        />
      </div>

      {/* Panel Content - Only render when maximized */}
      {!isMinimized && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};

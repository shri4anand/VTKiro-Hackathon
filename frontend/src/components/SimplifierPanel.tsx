import React from 'react';
import { PanelToggleButton } from './PanelToggleButton';

interface SimplifierPanelProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
  children: React.ReactNode;
}

export const SimplifierPanel: React.FC<SimplifierPanelProps> = ({
  isMinimized,
  onToggleMinimize,
  isFocused,
  onFocusChange,
  children,
}) => {
  return (
    <div
      className={`absolute top-4 left-4 max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-lg shadow-lg z-10 transition-all duration-300 ease-in-out motion-reduce:transition-none ${
        isMinimized ? 'w-12' : 'w-64'
      } ${
        !isMinimized && (isFocused ? 'opacity-100' : 'opacity-40 hover:opacity-100')
      } ${
        isMinimized ? 'opacity-100' : ''
      }`}
      onMouseEnter={() => !isMinimized && onFocusChange(true)}
      onMouseLeave={() => !isMinimized && onFocusChange(false)}
      onFocus={() => !isMinimized && onFocusChange(true)}
      onBlur={(e) => {
        if (!isMinimized && !e.currentTarget.contains(e.relatedTarget as Node)) {
          onFocusChange(false);
        }
      }}
      aria-expanded={!isMinimized}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4">
        <h1
          className={`font-bold text-gray-900 ${
            isMinimized ? 'text-sm' : 'text-xl'
          }`}
          style={isMinimized ? { writingMode: 'vertical-rl' } : undefined}
        >
          Crisis Text Simplifier
        </h1>
        <PanelToggleButton
          isMinimized={isMinimized}
          onClick={onToggleMinimize}
          panelName="Simplifier"
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

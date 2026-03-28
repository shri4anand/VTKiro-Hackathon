import React, { useEffect } from "react";
import { AppStateProvider, useAppState, useAppDispatch } from "./store/appState";
import { AlertInputPanel } from "./components/AlertInputPanel";
import { LanguageToggle } from "./components/LanguageToggle";
import { OutputPanel } from "./components/OutputPanel";
import { StatusRegion } from "./components/StatusRegion";
import { MapView } from "./components/MapView";
import { FeedPanel } from "./components/FeedPanel";
import { FeedPanelWrapper } from "./components/FeedPanelWrapper";
import { SimplifierPanel } from "./components/SimplifierPanel";
import { ReadingLevelSelector } from "./components/ReadingLevelSelector";
import { useSimplify } from "./hooks/useSimplify";
import { useMapEvents } from "./hooks/useMapEvents";
import { useFeedPoller } from "./hooks/useFeedPoller";

function AppContent() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { simplify } = useSimplify();
  const { events, error: mapError } = useMapEvents();
  const [isSimplifierFocused, setIsSimplifierFocused] = React.useState(false);
  const [isSimplifierMinimized, setIsSimplifierMinimized] = React.useState(false);
  const [isFeedFocused, setIsFeedFocused] = React.useState(false);
  const [isFeedMinimized, setIsFeedMinimized] = React.useState(false);
  
  // Start feed polling
  useFeedPoller();

  const handleLanguageChange = (newLanguage: typeof state.language) => {
    dispatch({ type: "SET_LANGUAGE", payload: newLanguage });
  };

  const handleInputChange = (text: string) => {
    dispatch({ type: "SET_INPUT_TEXT", payload: text });
  };

  const handleSubmit = () => {
    simplify();
  };

  const handleReadingLevelChange = (level: typeof state.activeLevel) => {
    dispatch({ type: "SET_ACTIVE_LEVEL", payload: level });
  };

  useEffect(() => {
    if (state.inputText && state.variants && state.variants.length > 0) {
      simplify();
    }
  }, [state.language]);

  return (
    <div className="min-h-screen bg-gray-50">
      <StatusRegion />
      
      {/* Map View - Full Screen */}
      <MapView
        events={events}
        feedItems={state.feed.items}
        activeLevel={state.activeLevel}
        datasetError={mapError}
      />

      {/* Simplifier Panel - Overlay with auto-fade */}
      <SimplifierPanel
        isMinimized={isSimplifierMinimized}
        onToggleMinimize={() => setIsSimplifierMinimized(!isSimplifierMinimized)}
        isFocused={isSimplifierFocused}
        onFocusChange={setIsSimplifierFocused}
      >
        <div className="mb-4">
          <AlertInputPanel
            inputText={state.inputText}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={state.status === "loading"}
          />
        </div>

        <div className="mb-4">
          <div className="mb-3">
            <h2 className="text-xs font-semibold text-gray-900 mb-2">
              Output Language
            </h2>
            <LanguageToggle
              language={state.language}
              onChange={handleLanguageChange}
            />
          </div>

          <div>
            <h2 className="text-xs font-semibold text-gray-900 mb-2">
              Reading Level
            </h2>
            <ReadingLevelSelector
              activeLevel={state.activeLevel}
              onChange={handleReadingLevelChange}
            />
          </div>
        </div>

        <OutputPanel />
      </SimplifierPanel>

      {/* Feed Panel - Overlay */}
      <FeedPanelWrapper
        isMinimized={isFeedMinimized}
        onToggleMinimize={() => setIsFeedMinimized(!isFeedMinimized)}
        isFocused={isFeedFocused}
        onFocusChange={setIsFeedFocused}
      >
        <FeedPanel />
      </FeedPanelWrapper>
    </div>
  );
}

function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;

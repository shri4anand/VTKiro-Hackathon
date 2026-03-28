import React, { useEffect } from "react";
import { AppStateProvider, useAppState, useAppDispatch } from "./store/appState";
import { AlertInputPanel } from "./components/AlertInputPanel";
import { LanguageToggle } from "./components/LanguageToggle";
import { ReadingLevelSelector } from "./components/ReadingLevelSelector";
import { OutputPanel } from "./components/OutputPanel";
import { StatusRegion } from "./components/StatusRegion";
import { MapView } from "./components/MapView";
import { FeedPanel } from "./components/FeedPanel";
import { useSimplify } from "./hooks/useSimplify";
import { useMapEvents } from "./hooks/useMapEvents";
import { useFeedPoller } from "./hooks/useFeedPoller";

function AppContent() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { simplify, status, variants, error } = useSimplify();
  const { events, loading: mapLoading, error: mapError } = useMapEvents();
  
  // Start feed polling
  useFeedPoller();

  // Wire language toggle to dispatch SET_LANGUAGE action
  const handleLanguageChange = (newLanguage: typeof state.language) => {
    dispatch({ type: "SET_LANGUAGE", payload: newLanguage });
  };

  // Wire reading level selector to dispatch SET_ACTIVE_LEVEL action
  const handleReadingLevelChange = (newLevel: typeof state.activeLevel) => {
    dispatch({ type: "SET_ACTIVE_LEVEL", payload: newLevel });
  };

  // Wire input text changes to dispatch SET_INPUT_TEXT action
  const handleInputChange = (text: string) => {
    dispatch({ type: "SET_INPUT_TEXT", payload: text });
  };

  // Wire submit button to call simplify
  const handleSubmit = (text: string) => {
    simplify();
  };

  // Watch for language changes and re-trigger simplify if there's existing input and variants
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

      {/* Simplifier Panel - Overlay */}
      <div className="absolute top-4 left-4 w-96 max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-lg shadow-lg p-6 z-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Crisis Text Simplifier
        </h1>

        <div className="mb-6">
          <AlertInputPanel
            inputText={state.inputText}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={state.status === "loading"}
          />
        </div>

        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Output Language
            </h2>
            <LanguageToggle
              language={state.language}
              onChange={handleLanguageChange}
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Reading Level
            </h2>
            <ReadingLevelSelector
              activeLevel={state.activeLevel}
              onChange={handleReadingLevelChange}
            />
          </div>
        </div>

        <OutputPanel />
      </div>

      {/* Feed Panel - Overlay */}
      <div className="absolute top-4 right-4 w-96 max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-lg shadow-lg z-10">
        <FeedPanel />
      </div>
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

import React, { useEffect } from "react";
import { AppStateProvider, useAppState, useAppDispatch } from "./store/appState";
import { AlertInputPanel } from "./components/AlertInputPanel";
import { LanguageToggle } from "./components/LanguageToggle";
import { ReadingLevelSelector } from "./components/ReadingLevelSelector";
import { OutputPanel } from "./components/OutputPanel";
import { StatusRegion } from "./components/StatusRegion";
import { useSimplify } from "./hooks/useSimplify";

function AppContent() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { simplify, status, variants, error } = useSimplify();

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
    <div className="min-h-screen bg-gray-50 p-4">
      <StatusRegion />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Crisis Text Simplifier
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <AlertInputPanel
            inputText={state.inputText}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={state.status === "loading"}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Output Language
            </h2>
            <LanguageToggle
              language={state.language}
              onChange={handleLanguageChange}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
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

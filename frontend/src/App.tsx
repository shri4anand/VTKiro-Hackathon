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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <StatusRegion />
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
            Crisis Text Simplifier
          </h1>
          <p className="text-slate-600 text-sm">Make emergency alerts accessible to everyone</p>
        </div>

        <div className="card-gradient p-6 mb-6">
          <AlertInputPanel
            inputText={state.inputText}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={state.status === "loading"}
          />
        </div>

        <div className="card-gradient p-6 mb-6">
          <div className="mb-6 pb-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></span>
              Output Language
            </h2>
            <LanguageToggle
              language={state.language}
              onChange={handleLanguageChange}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-accent-500 to-accent-600 rounded-full"></span>
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

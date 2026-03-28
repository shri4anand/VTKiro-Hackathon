import { useEffect } from "react";
import { AppStateProvider, useAppState, useAppDispatch } from "./store/appState";
import { AlertInputPanel } from "./components/AlertInputPanel";
import { LanguageToggle } from "./components/LanguageToggle";
import { OutputPanel } from "./components/OutputPanel";
import { StatusRegion } from "./components/StatusRegion";
import { FeedPanel } from "./components/FeedPanel";
import { useSimplify } from "./hooks/useSimplify";
import { useTTS } from "./hooks/useTTS";

function AppContent() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { simplify } = useSimplify();
  const { stop, isAvailable } = useTTS();

  const handleLanguageChange = (newLanguage: typeof state.language) => {
    dispatch({ type: "SET_LANGUAGE", payload: newLanguage });
  };

  const handleInputChange = (text: string) => {
    dispatch({ type: "SET_INPUT_TEXT", payload: text });
  };

  const handleSubmit = () => {
    simplify();
  };

  useEffect(() => {
    if (state.inputText && state.variants && state.variants.length > 0) {
      simplify();
    }
  }, [state.language]);

  const currentPlayingVariant = state.variants?.find(v => v.level === state.playingLevel);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background overflow-x-hidden">
      <StatusRegion />
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-surface-variant px-6 lg:px-10 py-3 bg-surface z-20">
          <div className="flex items-center gap-4 text-on-surface">
            <div className="size-6 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
                <path clipRule="evenodd" d="M39.998 12.236C39.9944 12.2537 39.9875 12.2845 39.9748 12.3294C39.9436 12.4399 39.8949 12.5741 39.8346 12.7175C39.8168 12.7597 39.7989 12.8007 39.7813 12.8398C38.5103 13.7113 35.9788 14.9393 33.7095 15.4811C30.9875 16.131 27.6413 16.5217 24 16.5217C20.3587 16.5217 17.0125 16.131 14.2905 15.4811C12.0012 14.9346 9.44505 13.6897 8.18538 12.8168C8.17384 12.7925 8.16216 12.767 8.15052 12.7408C8.09919 12.6249 8.05721 12.5114 8.02977 12.411C8.00356 12.3152 8.00039 12.2667 8.00004 12.2612C8.00004 12.261 8 12.2607 8.00004 12.2612C8.00004 12.2359 8.0104 11.9233 8.68485 11.3686C9.34546 10.8254 10.4222 10.2469 11.9291 9.72276C14.9242 8.68098 19.1919 8 24 8C28.8081 8 33.0758 8.68098 36.0709 9.72276C37.5778 10.2469 38.6545 10.8254 39.3151 11.3686C39.9006 11.8501 39.9857 12.1489 39.998 12.236ZM4.95178 15.2312L21.4543 41.6973C22.6288 43.5809 25.3712 43.5809 26.5457 41.6973L43.0534 15.223C43.0709 15.1948 43.0878 15.1662 43.104 15.1371L41.3563 14.1648C43.104 15.1371 43.1038 15.1374 43.104 15.1371L43.1051 15.135L43.1065 15.1325L43.1101 15.1261L43.1199 15.1082C43.1276 15.094 43.1377 15.0754 43.1497 15.0527C43.1738 15.0075 43.2062 14.9455 43.244 14.8701C43.319 14.7208 43.4196 14.511 43.5217 14.2683C43.6901 13.8679 44 13.0689 44 12.2609C44 10.5573 43.003 9.22254 41.8558 8.2791C40.6947 7.32427 39.1354 6.55361 37.385 5.94477C33.8654 4.72057 29.133 4 24 4C18.867 4 14.1346 4.72057 10.615 5.94478C8.86463 6.55361 7.30529 7.32428 6.14419 8.27911C4.99695 9.22255 3.99999 10.5573 3.99999 12.2609C3.99999 13.1275 4.29264 13.9078 4.49321 14.3607C4.60375 14.6102 4.71348 14.8196 4.79687 14.9689C4.83898 15.0444 4.87547 15.1065 4.9035 15.1529C4.91754 15.1762 4.92954 15.1957 4.93916 15.2111L4.94662 15.223L4.95178 15.2312ZM35.9868 18.996L24 38.22L12.0131 18.996C12.4661 19.1391 12.9179 19.2658 13.3617 19.3718C16.4281 20.1039 20.0901 20.5217 24 20.5217C27.9099 20.5217 31.5719 20.1039 34.6383 19.3718C35.082 19.2658 35.5339 19.1391 35.9868 18.996Z" fill="currentColor" fillRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-on-surface text-xl font-black leading-tight tracking-[-0.015em]">Crisis Clear</h2>
          </div>
          <div className="flex flex-1 justify-end items-center gap-6">
            <LanguageToggle language={state.language} onChange={handleLanguageChange} />
            <div className="flex gap-2">
              <button className="flex items-center justify-center rounded-xl h-10 w-10 bg-surface-container-highest text-on-surface hover:bg-surface-variant transition-all">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col lg:flex-row gap-0 overflow-hidden">
          {/* Left Section - Input & Output */}
          <section className="flex-[2.5] flex flex-col p-6 lg:p-12 overflow-y-auto no-scrollbar">
            <div className="max-w-[840px] w-full mx-auto space-y-10">
              {/* Hero */}
              <div className="space-y-2">
                <h1 className="text-on-background text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                  Simplify <span className="text-primary italic">Crisis</span> Alert
                </h1>
                <p className="text-on-surface-variant text-lg max-w-xl font-medium leading-relaxed">
                  Transform complex emergency jargon into clear, actionable instructions for all reading levels.
                </p>
              </div>

              {/* Input Panel */}
              <AlertInputPanel
                inputText={state.inputText}
                onChange={handleInputChange}
                onSubmit={handleSubmit}
                isLoading={state.status === "loading"}
              />

              {/* Output Panel */}
              <OutputPanel />
            </div>
          </section>

          {/* Right Section - Feed */}
          <FeedPanel />
        </main>

        {/* Floating Audio Player */}
        {state.playingLevel && currentPlayingVariant && isAvailable && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[500px] z-50">
            <div className="bg-surface/70 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={stop}
                  className="size-10 bg-primary text-on-primary rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>pause</span>
                </button>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tighter text-on-surface-variant leading-none mb-1">Now Reading</p>
                  <p className="text-xs font-bold text-on-surface leading-none">
                    {state.playingLevel === "grade3" && "Grade 3"}
                    {state.playingLevel === "grade6" && "Grade 6"}
                    {state.playingLevel === "grade9" && "Grade 9"}
                  </p>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-outline-variant/30"></div>
              <div className="flex items-center gap-4">
                <button className="material-symbols-outlined text-on-surface hover:text-primary transition-colors">fast_rewind</button>
                <button className="material-symbols-outlined text-on-surface hover:text-primary transition-colors">fast_forward</button>
                <div className="relative group">
                  <button className="flex items-center gap-1 bg-surface-container-highest px-3 py-1.5 rounded-full text-xs font-bold">1.0x</button>
                </div>
              </div>
            </div>
          </div>
        )}
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

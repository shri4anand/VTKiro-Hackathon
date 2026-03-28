import { useAppState } from "../store/appState";
import { SimplifiedCard } from "./SimplifiedCard";

export function OutputPanel() {
  const state = useAppState();

  if (state.status === "idle" || !state.variants) {
    return null;
  }

  if (state.status === "loading") {
    return (
      <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
          <p className="text-primary-800 font-medium">Simplifying text...</p>
        </div>
      </div>
    );
  }

  if (state.status === "error" && state.error) {
    return (
      <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 shadow-md">
        <p className="text-red-800 font-medium mb-3">{state.error.error}</p>
        {(state.error.code === "LLM_UNAVAILABLE" || state.error.code === "TIMEOUT") && (
          <button className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 text-sm font-medium transition-all">
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-gradient-to-b from-warm-500 to-warm-600 rounded-full"></span>
        Simplified Versions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {state.variants.map((variant) => (
          <SimplifiedCard
            key={variant.level}
            variant={variant}
            language={state.language}
          />
        ))}
      </div>
    </div>
  );
}

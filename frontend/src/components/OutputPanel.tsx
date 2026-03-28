import { useAppState } from "../store/appState";
import { SimplifiedCard } from "./SimplifiedCard";

export function OutputPanel() {
  const state = useAppState();

  if (state.status === "idle" || !state.variants) {
    return null;
  }

  if (state.status === "loading") {
    return (
      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 font-medium">Simplifying text...</p>
      </div>
    );
  }

  if (state.status === "error" && state.error) {
    return (
      <div className="mt-8 p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-800 font-medium mb-3">{state.error.error}</p>
        {(state.error.code === "LLM_UNAVAILABLE" || state.error.code === "TIMEOUT") && (
          <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium">
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Simplified Versions</h2>
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

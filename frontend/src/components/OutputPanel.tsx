import { useAppState } from "../store/appState";
import { SimplifiedCard } from "./SimplifiedCard";

export function OutputPanel() {
  const state = useAppState();

  if (state.status === "idle" || !state.variants) {
    return null;
  }

  if (state.status === "loading") {
    return (
      <div className="space-y-8 pb-12">
        <h2 className="text-on-surface text-2xl font-bold border-l-4 border-primary pl-4">Simplicity Levels</h2>
        <div className="bg-surface-container-low rounded-xl p-8 animate-pulse">
          <p className="text-on-surface-variant">Simplifying text...</p>
        </div>
      </div>
    );
  }

  if (state.status === "error" && state.error) {
    return (
      <div className="space-y-8 pb-12">
        <h2 className="text-on-surface text-2xl font-bold border-l-4 border-error pl-4">Error</h2>
        <div className="bg-error-container rounded-xl p-8">
          <p className="text-on-error-container font-medium">{state.error.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <h2 className="text-on-surface text-2xl font-bold border-l-4 border-primary pl-4">Simplicity Levels</h2>
      <div className="space-y-6">
        {state.variants.map((variant, index) => (
          <SimplifiedCard
            key={variant.level}
            variant={variant}
            language={state.language}
            isFirst={index === 0}
          />
        ))}
      </div>
    </div>
  );
}

import { createContext, useContext, useReducer, ReactNode, createElement } from "react";
import { AppState, Language, ReadingLevel, SimplifiedVariant, AppError, FeedItem, FeedError } from "../types";

// --- Actions ---

type Action =
  | { type: "SET_INPUT_TEXT"; payload: string }
  | { type: "SET_LANGUAGE"; payload: Language }
  | { type: "SET_ACTIVE_LEVEL"; payload: ReadingLevel }
  | { type: "SET_STATUS"; payload: AppState["status"] }
  | { type: "SET_VARIANTS"; payload: SimplifiedVariant[] | null }
  | { type: "SET_ERROR"; payload: AppError | null }
  | { type: "SET_PLAYING_LEVEL"; payload: ReadingLevel | null }
  | { type: "SET_LAST_PLAYED_LEVEL"; payload: ReadingLevel | null }
  | { type: "SET_FEED_ITEMS"; payload: FeedItem[] }
  | { type: "SET_IS_POLLING"; payload: boolean }
  | { type: "SET_FEED_ERROR"; payload: FeedError | null };

// --- Initial state ---

const initialState: AppState = {
  inputText: "",
  language: "en",
  activeLevel: "grade3",
  status: "idle",
  variants: null,
  error: null,
  playingLevel: null,
  lastPlayedLevel: null,
  feed: {
    items: [],
    isPolling: false,
    feedError: null,
  },
};

// --- Reducer ---

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_INPUT_TEXT":
      return { ...state, inputText: action.payload };
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    case "SET_ACTIVE_LEVEL":
      return { ...state, activeLevel: action.payload };
    case "SET_STATUS":
      return { ...state, status: action.payload };
    case "SET_VARIANTS":
      return { ...state, variants: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_PLAYING_LEVEL":
      return { ...state, playingLevel: action.payload };
    case "SET_LAST_PLAYED_LEVEL":
      return { ...state, lastPlayedLevel: action.payload };
    case "SET_FEED_ITEMS":
      return { ...state, feed: { ...state.feed, items: action.payload } };
    case "SET_IS_POLLING":
      return { ...state, feed: { ...state.feed, isPolling: action.payload } };
    case "SET_FEED_ERROR":
      return { ...state, feed: { ...state.feed, feedError: action.payload } };
    default:
      return state;
  }
}

// --- Contexts ---

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined);

// --- Provider ---

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return createElement(
    AppStateContext.Provider,
    { value: state },
    createElement(AppDispatchContext.Provider, { value: dispatch }, children)
  );
}

// --- Hooks ---

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

export function useAppDispatch(): React.Dispatch<Action> {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error("useAppDispatch must be used within AppStateProvider");
  return ctx;
}

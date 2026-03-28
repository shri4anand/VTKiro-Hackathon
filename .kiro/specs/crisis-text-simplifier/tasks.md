# Implementation Plan: AI Crisis Text Simplifier

## Overview

Implement a React + Tailwind frontend with a Node.js or Python backend. The frontend handles text input, language/level selection, TTS playback, and an auto-polling feed. The backend exposes `/api/simplify` and `/api/feed`, integrates with an LLM for simplification/translation, scores output with Flesch-Kincaid, and fetches articles from NewsAPI.

## Tasks

- [x] 1. Project setup and core types
  - Scaffold React + Tailwind frontend (Vite) and backend (Node.js Express or Python FastAPI)
  - Define all TypeScript interfaces: `AlertInput`, `Language`, `ReadingLevel`, `SimplifiedVariant`, `SimplifyResponse`, `AppError`, `FeedItem`, `FeedResponse`, `FeedError`, `AppState`
  - Configure environment variables: `LLM_API_KEY`, `NEWS_API_KEY`
  - Install dependencies: `fast-check` (frontend tests), `axios` or `fetch`, TTS via Web Speech API (no install needed)
  - _Requirements: 1.1, 2.1, 3.1, 7.1_

- [x] 2. Input validation and AlertInputPanel
  - [x] 2.1 Implement `validateInput(text: string)` — accepts 1–10000 chars, rejects empty or over-limit
    - Return typed result: `{ valid: true }` or `{ valid: false, reason: "EMPTY" | "TOO_LONG" }`
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Write property test for input validation (Property 1)
    - **Property 1: Input length validation**
    - **Validates: Requirements 1.1, 1.3**
    - `// Feature: crisis-text-simplifier, Property 1: Input length validation`
    - Generate strings of random length; assert accept/reject based on 1–10000 bounds

  - [x] 2.3 Build `AlertInputPanel` component
    - Textarea with live character counter, inline validation messages, disabled submit when over limit
    - ARIA label on textarea and submit button; visible focus indicator
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3_

  - [x] 2.4 Write unit tests for AlertInputPanel
    - Empty submit shows validation message; 10000-char input accepted; 10001-char input rejected and button disabled
    - _Requirements: 1.2, 1.3_

- [x] 3. LanguageToggle and ReadingLevelSelector components
  - Build `LanguageToggle` — renders buttons/select for `en | es | fr | zh | ar | pt` with ARIA labels
  - Build `ReadingLevelSelector` — renders controls for `grade3 | grade6 | grade9` with ARIA labels
  - Wire both into shared `AppState` (language, activeLevel)
  - _Requirements: 3.1, 3.2, 5.3_

- [ ] 4. Backend POST /api/simplify endpoint
  - [x] 4.1 Implement request validation — reject if text empty, > 10000 chars, or language invalid; return `VALIDATION_ERROR`
    - _Requirements: 1.1, 1.3_

  - [x] 4.2 Implement LLM prompt builder and caller
    - Use the prompt template from the design doc with `{language}` and `{alert_input}` substitution
    - Parse JSON response; return `MALFORMED_RESPONSE` if structure is wrong
    - Apply 15-second timeout; return `TIMEOUT` on abort
    - Return `LLM_UNAVAILABLE` on connection failure
    - _Requirements: 2.1, 2.3, 2.4, 6.1, 6.2, 6.4_

  - [x] 4.3 Implement Flesch-Kincaid scorer
    - Score each of the three variants server-side (`textstat` for Python or `text-readability` for Node)
    - Attach `fkScore` to each variant in the response
    - _Requirements: 2.5, 2.6, 2.7_

  - [x] 4.4 Write property test for FK score bounds (Property 5)
    - **Property 5: FK score bounds per reading level**
    - **Validates: Requirements 2.5, 2.6, 2.7**
    - `// Feature: crisis-text-simplifier, Property 5: FK score bounds per reading level`
    - Generate valid inputs; assert `grade3.fkScore <= 4.0`, `4.1 <= grade6.fkScore <= 7.0`, `7.1 <= grade9.fkScore <= 10.0`

  - [x] 4.5 Write property test for three-variant response (Property 3)
    - **Property 3: Response always contains three level variants**
    - **Validates: Requirements 2.1**
    - `// Feature: crisis-text-simplifier, Property 3: Response always contains three level variants`
    - Generate valid inputs; assert response has exactly 3 variants with keys `grade3`, `grade6`, `grade9`

  - [x] 4.6 Write property test for valid input forwarding (Property 2)
    - **Property 2: Valid input is forwarded to the Simplifier**
    - **Validates: Requirements 1.4**
    - `// Feature: crisis-text-simplifier, Property 2: Valid input is forwarded to the Simplifier`
    - Generate valid strings; assert LLM mock called with exact input text

  - [x] 4.7 Write unit tests for /api/simplify error paths
    - LLM unavailable → `LLM_UNAVAILABLE`; timeout → `TIMEOUT`; malformed JSON → `MALFORMED_RESPONSE`; empty text → `VALIDATION_ERROR`
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 5. Checkpoint — Ensure all backend simplify tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Frontend simplification flow and OutputPanel
  - [x] 6.1 Implement `useSimplify` hook (or equivalent state logic)
    - POST to `/api/simplify` with `AbortController` 15-second timeout
    - Manage `status`, `variants`, `error` in `AppState`
    - Preserve `inputText` on any error
    - _Requirements: 1.4, 2.4, 6.2, 6.3_

  - [x] 6.2 Write property test for input preservation on error (Property 13)
    - **Property 13: Alert input is preserved on any error**
    - **Validates: Requirements 6.3**
    - `// Feature: crisis-text-simplifier, Property 13: Alert input is preserved on any error`
    - Generate error conditions; assert `inputText` unchanged after error

  - [x] 6.3 Build `OutputPanel` and `SimplifiedCard` components
    - Render all three cards simultaneously on success; each card shows level badge, text, and FK score
    - Show retry button on `LLM_UNAVAILABLE` and `TIMEOUT` errors; highlight input on `VALIDATION_ERROR`
    - _Requirements: 2.2, 6.1, 6.4_

  - [x] 6.4 Write property test for simultaneous rendering (Property 4)
    - **Property 4: All three variants are rendered simultaneously**
    - **Validates: Requirements 2.2**
    - `// Feature: crisis-text-simplifier, Property 4: All three variants are rendered simultaneously`
    - Generate valid responses; assert all 3 cards present in output panel

  - [x] 6.5 Wire language toggle to re-trigger `/api/simplify` with new language
    - Language change dispatches new request; all three cards update without manual resubmit
    - _Requirements: 3.2, 3.4, 3.5_

  - [x] 6.6 Write property test for language update (Property 6)
    - **Property 6: Language selection updates all displayed variants**
    - **Validates: Requirements 3.2, 3.4** 
    - `// Feature: crisis-text-simplifier, Property 6: Language selection updates all displayed variants`
    - Generate language selections; assert all rendered cards reflect selected language

  - [x] 6.7 Implement ARIA live `StatusRegion` component
    - Announce `loading` and `success` state transitions to screen readers
    - _Requirements: 5.5, 5.6_

  - [x] 6.8 Write property test for ARIA live region (Property 12)
    - **Property 12: ARIA live region reflects loading and success states**
    - **Validates: Requirements 5.5, 5.6**
    - `// Feature: crisis-text-simplifier, Property 12: ARIA live region reflects loading and success states`
    - Generate state transitions; assert ARIA live region is non-empty on loading/success

  - [x] 6.9 Write property test for ARIA labels (Property 11)
    - **Property 11: ARIA labels on all interactive controls**
    - **Validates: Requirements 5.3**
    - `// Feature: crisis-text-simplifier, Property 11: ARIA labels on all interactive controls`
    - Generate app states; assert all interactive controls have non-empty `aria-label`

  - [x] 6.10 Write unit tests for rendering and error handling
    - Known alert text → correct output structure; LLM unavailable → retry button; timeout → loading cleared; malformed → generic message
    - Language toggle change → new API call with correct language param
    - _Requirements: 2.2, 3.4, 6.1, 6.2, 6.4_

- [x] 7. Audio playback (TTS)
  - [x] 7.1 Implement `useTTS` hook using Web Speech API
    - `play(text, language)` sets `playingLevel`; `stop()` clears it
    - If `speechSynthesis` unavailable, hide play buttons and show static note
    - On TTS error, show "Audio unavailable for this variant." on the affected card
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [x] 7.2 Add `AudioControls` to each `SimplifiedCard`
    - Play button with ARIA label; stop button; playing indicator shown when `playingLevel === card.level`
    - _Requirements: 4.1, 4.3, 5.3_

  - [x] 7.3 Write property test for play button presence (Property 7)
    - **Property 7: Each output card has a play button**
    - **Validates: Requirements 4.1**
    - `// Feature: crisis-text-simplifier, Property 7: Each output card has a play button`
    - Generate valid responses; assert each card contains a play button element

  - [x] 7.4 Write property test for TTS invocation (Property 8)
    - **Property 8: TTS is called with correct text and language**
    - **Validates: Requirements 4.2, 4.6**
    - `// Feature: crisis-text-simplifier, Property 8: TTS is called with correct text and language`
    - Generate card selections and language choices; assert TTS mock called with correct text and language

  - [x] 7.5 Write property test for playing indicator (Property 9)
    - **Property 9: Playing indicator is shown during active playback**
    - **Validates: Requirements 4.3**
    - `// Feature: crisis-text-simplifier, Property 9: Playing indicator is shown during active playback`
    - Generate `playingLevel` values; assert correct card shows playing indicator

  - [x] 7.6 Write property test for stop control (Property 10)
    - **Property 10: Stop control halts TTS**
    - **Validates: Requirements 4.4**
    - `// Feature: crisis-text-simplifier, Property 10: Stop control halts TTS`
    - Generate active playback states; assert stop sets `playingLevel` to null and calls TTS stop

  - [x] 7.7 Write unit tests for TTS
    - Play activates indicator; stop clears it; TTS failure shows audio unavailable message; Web Speech API absent hides play buttons
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 8. Checkpoint — Ensure all frontend simplify and TTS tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Backend GET /api/feed endpoint
  - [x] 9.1 Implement NewsAPI integration
    - Fetch up to 20 articles matching `emergency OR crisis OR disaster OR evacuation` from last 24 hours
    - Filter out articles with body text < 50 chars; deduplicate by article URL hash (`id`)
    - Store `NEWS_API_KEY` in environment variable
    - _Requirements: 7.1, 7.2_

  - [x] 9.2 Implement feed simplification pipeline
    - For each article, call LLM simplifier (reuse `/api/simplify` logic) to produce three variants with FK scores
    - Return array of `FeedItem` objects with `id`, `title`, `source`, `publishedAt`, `variants`, and top-level `fetchedAt`
    - Return `NEWS_SOURCE_UNAVAILABLE`, `TIMEOUT`, or `MALFORMED_RESPONSE` on failure
    - _Requirements: 7.2, 7.8_

  - [x] 9.3 Write property test for per-article simplifier calls (Property 15)
    - **Property 15: Each retrieved article is passed to the Simplifier**
    - **Validates: Requirements 7.2**
    - `// Feature: crisis-text-simplifier, Property 15: Each retrieved article is passed to the Simplifier`
    - Generate article batches; assert Simplifier called exactly once per article with correct text

  - [x] 9.4 Write property test for Feed_Item FK score bounds (Property 20)
    - **Property 20: Feed_Item FK scores satisfy reading level bounds**
    - **Validates: Requirements 7.8**
    - `// Feature: crisis-text-simplifier, Property 20: Feed_Item FK scores satisfy reading level bounds`
    - Generate Feed_Items via feed pipeline; assert all variant fkScores satisfy level-specific bounds

  - [x] 9.5 Write unit tests for /api/feed
    - Successful fetch returns array of FeedItems; NewsAPI unavailable → `NEWS_SOURCE_UNAVAILABLE`; timeout → `TIMEOUT`; malformed → `MALFORMED_RESPONSE`
    - _Requirements: 7.1, 7.2, 7.6_

- [ ] 10. Frontend FeedPanel with auto-polling
  - [x] 10.1 Build `FeedPanel` and `FeedItem` components
    - Each `FeedItem` shows `title`, `source`, `publishedAt`, and `SimplifiedText` for `activeLevel`
    - `FeedStatusBar` shows polling indicator when `isPolling` is true and error banner on failure
    - _Requirements: 7.3, 7.5, 7.6_

  - [x] 10.2 Implement `useFeedPoller` hook
    - `setInterval` every 300,000 ms; dispatch `GET /api/feed` on mount and each tick
    - On success: prepend new items to feed list, preserve existing items
    - On failure: retain existing items, set `feedError`, show non-blocking banner (auto-dismiss after 10 s)
    - Clear interval on unmount
    - _Requirements: 7.1, 7.4, 7.6_

  - [x] 10.3 Wire `activeLevel` from shared state into FeedPanel
    - When user changes `ReadingLevelSelector`, all `FeedItem` components re-render to show the correct variant
    - _Requirements: 7.3, 7.7_

  - [x] 10.4 Write property test for polling interval (Property 14)
    - **Property 14: Feed polling fires on the correct interval**
    - **Validates: Requirements 7.1**
    - `// Feature: crisis-text-simplifier, Property 14: Feed polling fires on the correct interval`
    - Generate elapsed time intervals; assert poll function call count matches interval count plus initial mount call

  - [x] 10.5 Write property test for Feed_Item level rendering (Property 16)
    - **Property 16: Feed_Items display the active Reading_Level variant**
    - **Validates: Requirements 7.3, 7.7**
    - `// Feature: crisis-text-simplifier, Property 16: Feed_Items display the active Reading_Level variant`
    - Generate feed states and reading levels; assert each Feed_Item renders the correct variant

  - [x] 10.6 Write property test for feed prepend (Property 17)
    - **Property 17: New Feed_Items are prepended without removing existing items**
    - **Validates: Requirements 7.4**
    - `// Feature: crisis-text-simplifier, Property 17: New Feed_Items are prepended without removing existing items`
    - Generate existing feed lists and new article batches; assert length is N+M and new items appear first

  - [x] 10.7 Write property test for polling indicator (Property 18)
    - **Property 18: Polling indicator is shown during active poll**
    - **Validates: Requirements 7.5**
    - `// Feature: crisis-text-simplifier, Property 18: Polling indicator is shown during active poll`
    - Generate feed states with `isPolling=true`; assert polling indicator element is present

  - [x] 10.8 Write property test for feed error preservation (Property 19)
    - **Property 19: Feed items are preserved on polling failure**
    - **Validates: Requirements 7.6**
    - `// Feature: crisis-text-simplifier, Property 19: Feed items are preserved on polling failure`
    - Generate feed states and polling failures; assert feed items unchanged and error banner visible

  - [x] 10.9 Write unit tests for FeedPanel
    - Initial mount triggers poll; successful poll prepends items; failed poll shows non-blocking banner without clearing items; reading level change re-renders all Feed_Items
    - _Requirements: 7.1, 7.4, 7.6, 7.7_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Map feature setup and data layer
  - [x] 12.1 Install Mapbox GL JS dependencies
    - Run `npm install mapbox-gl supercluster` and `npm install --save-dev @types/mapbox-gl` in `frontend/`
    - Add `VITE_MAPBOX_TOKEN` to `frontend/.env.example`
    - _Requirements: 8.1, 8.2_

  - [x] 12.2 Create mock dataset at `public/data/map-events.json`
    - Add at least 8 sample `MapEvent` records covering all four severity levels (`low`, `medium`, `high`, `critical`) and varied global coordinates
    - Schema: `{ id, title, description, latitude, longitude, timestamp, severity }`
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 12.3 Add `SeverityLevel` and `MapEvent` types to `frontend/src/types.ts`
    - `type SeverityLevel = "low" | "medium" | "high" | "critical"`
    - `interface MapEvent { id, title, description, latitude, longitude, timestamp, severity }`
    - Add optional `latitude?: number` and `longitude?: number` fields to the existing `FeedItem` interface
    - _Requirements: 9.2, 10.2, 12.1_

  - [x] 12.4 Write property test for MapEvent required fields (Property 25)
    - **Property 25: MapEvent records contain all required fields**
    - **Validates: Requirements 10.2**
    - `// Feature: crisis-text-simplifier, Property 25: MapEvent records contain all required fields`
    - Generate MapEvent records from the dataset loader; assert each record has all seven required fields with non-null values

- [x] 13. Implement map hooks
  - [x] 13.1 Implement `useMapEvents` hook in `frontend/src/hooks/useMapEvents.ts`
    - Fetch `/data/map-events.json` on mount; store result in local `events` state
    - On fetch error, set `error` string and return empty `events` array so map renders without markers
    - Export `{ events: MapEvent[], loading: boolean, error: string | null }`
    - _Requirements: 10.1, 10.4_

  - [x] 13.2 Implement `useMapState` hook in `frontend/src/hooks/useMapState.ts`
    - Manage `selectedEventId: string | null` in local state
    - `selectEvent(id)`: set `selectedEventId` and call `history.replaceState` to write `#event=<id>`
    - `dismissEvent()`: clear `selectedEventId` and remove the hash from the URL
    - On mount, read `window.location.hash`; if it matches `#event=<id>` and the id exists in `events`, call `selectEvent`
    - Export `{ selectedEventId, selectedEvent, selectEvent, dismissEvent }`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 13.3 Write property test for deep link round-trip (Property 26)
    - **Property 26: Deep link round-trip**
    - **Validates: Requirements 11.2, 11.5**
    - `// Feature: crisis-text-simplifier, Property 26: Deep link round-trip`
    - Generate valid MapEvent ids; encode in URL hash, read back, assert round-trip equality and correct `selectedEventId` on load

  - [x] 13.4 Write property test for panel dismiss clears URL hash (Property 27)
    - **Property 27: Panel dismiss clears URL hash**
    - **Validates: Requirements 11.4**
    - `// Feature: crisis-text-simplifier, Property 27: Panel dismiss clears URL hash`
    - Generate selected event states; simulate panel dismiss and assert URL hash no longer contains event id

- [x] 14. Implement MapView component
  - [x] 14.1 Implement `MapView` component in `frontend/src/components/MapView.tsx`
    - Initialize Mapbox GL JS map with `style: 'mapbox://styles/mapbox/dark-v11'`, `center: [0, 20]`, `zoom: 1.8`
    - Add GeoJSON source `crisis-events` merging `MapEvent[]` and geo-tagged `FeedItem[]`; set `cluster: true`, `clusterMaxZoom: 10`, `clusterRadius: 50`
    - Add three layers: `clusters` (circle), `cluster-count` (symbol), `unclustered-point` (circle with severity color via `match` expression)
    - Severity color map: low → `#22c55e`, medium → `#eab308`, high → `#f97316`, critical → `#ef4444`
    - Register click handler on `unclustered-point` to call `selectEvent`; register click handler on map background to call `dismissEvent`
    - On mount, if URL hash contains a valid event id, fly to that event and open its panel
    - Show non-blocking error banner if `useMapEvents` returns an error
    - Props: `events: MapEvent[]`, `feedItems: FeedItem[]`, `activeLevel: ReadingLevel`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.6, 10.3, 10.4, 13.1, 13.2, 13.3_

  - [x] 14.2 Write property test for every MapEvent has a marker (Property 21)
    - **Property 21: Every Map_Event has a corresponding marker**
    - **Validates: Requirements 9.1**
    - `// Feature: crisis-text-simplifier, Property 21: Every Map_Event has a corresponding marker`
    - Generate arrays of MapEvent records; assert GeoJSON source feature count equals event count

  - [x] 14.3 Write property test for marker color matches severity (Property 22)
    - **Property 22: Marker color matches severity level**
    - **Validates: Requirements 9.2**
    - `// Feature: crisis-text-simplifier, Property 22: Marker color matches severity level`
    - Generate MapEvent records with random severity; assert severity-to-color mapping returns correct hex for each level

  - [x] 14.4 Write property test for geo-tagged Feed_Items appear as markers (Property 28)
    - **Property 28: Geo-tagged Feed_Items appear as map markers**
    - **Validates: Requirements 12.1**
    - `// Feature: crisis-text-simplifier, Property 28: Geo-tagged Feed_Items appear as map markers`
    - Generate FeedItem records with latitude/longitude; assert each produces a GeoJSON feature in the map source

  - [x] 14.5 Write property test for new geo-tagged Feed_Items add markers without removing existing (Property 30)
    - **Property 30: New geo-tagged Feed_Items add markers without removing existing ones**
    - **Validates: Requirements 12.3**
    - `// Feature: crisis-text-simplifier, Property 30: New geo-tagged Feed_Items add markers without removing existing ones`
    - Generate existing marker sets and new geo-tagged FeedItem batches; assert total marker count equals sum of both

- [x] 15. Implement EventDetailPanel component
  - [x] 15.1 Implement `EventDetailPanel` component in `frontend/src/components/EventDetailPanel.tsx`
    - Display event `title`, `description`, `timestamp` (formatted), and `severity` badge
    - For feed-sourced events, display `SimplifiedOutput` at `activeLevel` instead of raw description
    - Include close button that calls `dismissEvent`; also dismiss on `Escape` key
    - Set `aria-label` on the panel container identifying it as an event detail region
    - Move focus to the panel container on open (`autoFocus` or `useEffect` with `ref.focus()`)
    - Announce event title via the shared ARIA live region on open
    - _Requirements: 9.4, 9.5, 14.3, 14.4, 14.5_

  - [x] 15.2 Write property test for marker click opens panel; dismiss closes it (Property 23)
    - **Property 23: Marker click opens panel; dismiss closes it**
    - **Validates: Requirements 9.3, 9.5**
    - `// Feature: crisis-text-simplifier, Property 23: Marker click opens panel; dismiss closes it`
    - Generate MapEvent records; simulate marker click and assert `selectedEventId` is set; simulate dismiss and assert it is null

  - [x] 15.3 Write property test for event detail panel contains all required fields (Property 24)
    - **Property 24: Event detail panel contains all required fields**
    - **Validates: Requirements 9.4**
    - `// Feature: crisis-text-simplifier, Property 24: Event detail panel contains all required fields`
    - Generate MapEvent records; render EventDetailPanel and assert title, description, timestamp, and severity are all present

  - [x] 15.4 Write property test for Feed_Item panel shows correct reading level variant (Property 29)
    - **Property 29: Feed_Item panel shows correct reading level variant**
    - **Validates: Requirements 12.2, 12.4**
    - `// Feature: crisis-text-simplifier, Property 29: Feed_Item panel shows correct reading level variant`
    - Generate FeedItem marker selections and reading levels; assert EventDetailPanel shows the variant for the active level

  - [x] 15.5 Write property test for EventDetailPanel ARIA label and live region (Property 32)
    - **Property 32: Event detail panel has ARIA label and announces title on open**
    - **Validates: Requirements 14.4, 14.5**
    - `// Feature: crisis-text-simplifier, Property 32: Event detail panel has ARIA label and announces title on open`
    - Generate MapEvent records; render EventDetailPanel and assert `aria-label` is non-empty and ARIA live region contains event title

- [x] 16. Implement MapEventList component
  - [x] 16.1 Implement `MapEventList` component in `frontend/src/components/MapEventList.tsx`
    - Render a `<ul>` of all events; each `<li>` is keyboard-focusable (`tabIndex={0}`) and activates `selectEvent` on Enter/Space/click
    - Visually hidden on desktop by default (use `sr-only` or equivalent); always present in DOM for screen readers
    - Props: `events: MapEvent[]`, `selectEvent: (id: string) => void`
    - _Requirements: 14.1, 14.2_

  - [x] 16.2 Write property test for map event list contains all events (Property 31)
    - **Property 31: Map event list contains all events**
    - **Validates: Requirements 14.1**
    - `// Feature: crisis-text-simplifier, Property 31: Map event list contains all events`
    - Generate MapEvent arrays; render MapEventList and assert list item count equals event array length

- [x] 17. Integrate MapView into App.tsx and wire feed integration
  - [x] 17.1 Integrate `MapView` into `App.tsx`
    - Import and render `MapView` alongside existing panels
    - Pass `events` from `useMapEvents`, `feedItems` from `appState.feed.items`, and `activeLevel` from `appState.activeLevel`
    - _Requirements: 8.1, 12.1_

  - [x] 17.2 Update `useFeedPoller` to pass geo-tagged Feed_Items to the map
    - Ensure `FeedItem` objects with `latitude` and `longitude` are included in the feed state as-is (no extra transformation needed — `MapView` filters them)
    - _Requirements: 12.1, 12.3_

  - [x] 17.3 Export `useMapEvents` and `useMapState` from `frontend/src/hooks/index.ts`
    - _Requirements: 8.1_

- [x] 18. Write unit tests for map components
  - [x] 18.1 Write unit tests for `MapView` in `frontend/src/__tests__/unit/map.test.ts`
    - Dataset load failure shows non-blocking error banner and renders map without markers
    - Deep link with valid id flies to event and opens panel
    - Deep link with invalid id shows "Event not found" message and loads map normally
    - _Requirements: 10.4, 11.2, 11.3_

  - [x] 18.2 Write unit tests for `EventDetailPanel`
    - Renders title, description, timestamp, severity badge for a known MapEvent
    - Close button calls `dismissEvent`; Escape key calls `dismissEvent`
    - For a feed-sourced event, displays the correct variant text for the active reading level
    - _Requirements: 9.4, 9.5, 12.2_

  - [x] 18.3 Write unit tests for `MapEventList`
    - Renders correct number of list items for a known event array
    - Keyboard activation (Enter) on a list item calls `selectEvent` with the correct id
    - _Requirements: 14.1, 14.2_

- [x] 19. Final map checkpoint — Ensure all map tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (frontend/Node) and `Hypothesis` (Python backend); minimum 100 iterations each
- Every property test must include the comment tag: `// Feature: crisis-text-simplifier, Property {N}: {property_text}`
- Checkpoints ensure incremental validation before moving to the next phase

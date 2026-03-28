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
  - [x] 2.1 Implement `validateInput(text: string)` — accepts 1–5000 chars, rejects empty or over-limit
    - Return typed result: `{ valid: true }` or `{ valid: false, reason: "EMPTY" | "TOO_LONG" }`
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Write property test for input validation (Property 1)
    - **Property 1: Input length validation**
    - **Validates: Requirements 1.1, 1.3**
    - `// Feature: crisis-text-simplifier, Property 1: Input length validation`
    - Generate strings of random length; assert accept/reject based on 1–5000 bounds

  - [x] 2.3 Build `AlertInputPanel` component
    - Textarea with live character counter, inline validation messages, disabled submit when over limit
    - ARIA label on textarea and submit button; visible focus indicator
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3_

  - [x] 2.4 Write unit tests for AlertInputPanel
    - Empty submit shows validation message; 5000-char input accepted; 5001-char input rejected and button disabled
    - _Requirements: 1.2, 1.3_

- [x] 3. LanguageToggle and ReadingLevelSelector components
  - Build `LanguageToggle` — renders buttons/select for `en | es | fr | zh | ar | pt` with ARIA labels
  - Build `ReadingLevelSelector` — renders controls for `grade3 | grade6 | grade9` with ARIA labels
  - Wire both into shared `AppState` (language, activeLevel)
  - _Requirements: 3.1, 3.2, 5.3_

- [ ] 4. Backend POST /api/simplify endpoint
  - [x] 4.1 Implement request validation — reject if text empty, > 5000 chars, or language invalid; return `VALIDATION_ERROR`
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

  - [ ] 6.4 Write property test for simultaneous rendering (Property 4)
    - **Property 4: All three variants are rendered simultaneously**
    - **Validates: Requirements 2.2**
    - `// Feature: crisis-text-simplifier, Property 4: All three variants are rendered simultaneously`
    - Generate valid responses; assert all 3 cards present in output panel

  - [ ] 6.5 Wire language toggle to re-trigger `/api/simplify` with new language
    - Language change dispatches new request; all three cards update without manual resubmit
    - _Requirements: 3.2, 3.4, 3.5_

  - [ ] 6.6 Write property test for language update (Property 6)
    - **Property 6: Language selection updates all displayed variants**
    - **Validates: Requirements 3.2, 3.4**
    - `// Feature: crisis-text-simplifier, Property 6: Language selection updates all displayed variants`
    - Generate language selections; assert all rendered cards reflect selected language

  - [ ] 6.7 Implement ARIA live `StatusRegion` component
    - Announce `loading` and `success` state transitions to screen readers
    - _Requirements: 5.5, 5.6_

  - [ ] 6.8 Write property test for ARIA live region (Property 12)
    - **Property 12: ARIA live region reflects loading and success states**
    - **Validates: Requirements 5.5, 5.6**
    - `// Feature: crisis-text-simplifier, Property 12: ARIA live region reflects loading and success states`
    - Generate state transitions; assert ARIA live region is non-empty on loading/success

  - [ ] 6.9 Write property test for ARIA labels (Property 11)
    - **Property 11: ARIA labels on all interactive controls**
    - **Validates: Requirements 5.3**
    - `// Feature: crisis-text-simplifier, Property 11: ARIA labels on all interactive controls`
    - Generate app states; assert all interactive controls have non-empty `aria-label`

  - [ ] 6.10 Write unit tests for rendering and error handling
    - Known alert text → correct output structure; LLM unavailable → retry button; timeout → loading cleared; malformed → generic message
    - Language toggle change → new API call with correct language param
    - _Requirements: 2.2, 3.4, 6.1, 6.2, 6.4_

- [ ] 7. Audio playback (TTS)
  - [ ] 7.1 Implement `useTTS` hook using Web Speech API
    - `play(text, language)` sets `playingLevel`; `stop()` clears it
    - If `speechSynthesis` unavailable, hide play buttons and show static note
    - On TTS error, show "Audio unavailable for this variant." on the affected card
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [ ] 7.2 Add `AudioControls` to each `SimplifiedCard`
    - Play button with ARIA label; stop button; playing indicator shown when `playingLevel === card.level`
    - _Requirements: 4.1, 4.3, 5.3_

  - [ ] 7.3 Write property test for play button presence (Property 7)
    - **Property 7: Each output card has a play button**
    - **Validates: Requirements 4.1**
    - `// Feature: crisis-text-simplifier, Property 7: Each output card has a play button`
    - Generate valid responses; assert each card contains a play button element

  - [ ] 7.4 Write property test for TTS invocation (Property 8)
    - **Property 8: TTS is called with correct text and language**
    - **Validates: Requirements 4.2, 4.6**
    - `// Feature: crisis-text-simplifier, Property 8: TTS is called with correct text and language`
    - Generate card selections and language choices; assert TTS mock called with correct text and language

  - [ ] 7.5 Write property test for playing indicator (Property 9)
    - **Property 9: Playing indicator is shown during active playback**
    - **Validates: Requirements 4.3**
    - `// Feature: crisis-text-simplifier, Property 9: Playing indicator is shown during active playback`
    - Generate `playingLevel` values; assert correct card shows playing indicator

  - [ ] 7.6 Write property test for stop control (Property 10)
    - **Property 10: Stop control halts TTS**
    - **Validates: Requirements 4.4**
    - `// Feature: crisis-text-simplifier, Property 10: Stop control halts TTS`
    - Generate active playback states; assert stop sets `playingLevel` to null and calls TTS stop

  - [ ] 7.7 Write unit tests for TTS
    - Play activates indicator; stop clears it; TTS failure shows audio unavailable message; Web Speech API absent hides play buttons
    - _Requirements: 4.3, 4.4, 4.5_

- [ ] 8. Checkpoint — Ensure all frontend simplify and TTS tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Backend GET /api/feed endpoint
  - [ ] 9.1 Implement NewsAPI integration
    - Fetch up to 20 articles matching `emergency OR crisis OR disaster OR evacuation` from last 24 hours
    - Filter out articles with body text < 50 chars; deduplicate by article URL hash (`id`)
    - Store `NEWS_API_KEY` in environment variable
    - _Requirements: 7.1, 7.2_

  - [ ] 9.2 Implement feed simplification pipeline
    - For each article, call LLM simplifier (reuse `/api/simplify` logic) to produce three variants with FK scores
    - Return array of `FeedItem` objects with `id`, `title`, `source`, `publishedAt`, `variants`, and top-level `fetchedAt`
    - Return `NEWS_SOURCE_UNAVAILABLE`, `TIMEOUT`, or `MALFORMED_RESPONSE` on failure
    - _Requirements: 7.2, 7.8_

  - [ ] 9.3 Write property test for per-article simplifier calls (Property 15)
    - **Property 15: Each retrieved article is passed to the Simplifier**
    - **Validates: Requirements 7.2**
    - `// Feature: crisis-text-simplifier, Property 15: Each retrieved article is passed to the Simplifier`
    - Generate article batches; assert Simplifier called exactly once per article with correct text

  - [ ] 9.4 Write property test for Feed_Item FK score bounds (Property 20)
    - **Property 20: Feed_Item FK scores satisfy reading level bounds**
    - **Validates: Requirements 7.8**
    - `// Feature: crisis-text-simplifier, Property 20: Feed_Item FK scores satisfy reading level bounds`
    - Generate Feed_Items via feed pipeline; assert all variant fkScores satisfy level-specific bounds

  - [ ] 9.5 Write unit tests for /api/feed
    - Successful fetch returns array of FeedItems; NewsAPI unavailable → `NEWS_SOURCE_UNAVAILABLE`; timeout → `TIMEOUT`; malformed → `MALFORMED_RESPONSE`
    - _Requirements: 7.1, 7.2, 7.6_

- [ ] 10. Frontend FeedPanel with auto-polling
  - [ ] 10.1 Build `FeedPanel` and `FeedItem` components
    - Each `FeedItem` shows `title`, `source`, `publishedAt`, and `SimplifiedText` for `activeLevel`
    - `FeedStatusBar` shows polling indicator when `isPolling` is true and error banner on failure
    - _Requirements: 7.3, 7.5, 7.6_

  - [ ] 10.2 Implement `useFeedPoller` hook
    - `setInterval` every 300,000 ms; dispatch `GET /api/feed` on mount and each tick
    - On success: prepend new items to feed list, preserve existing items
    - On failure: retain existing items, set `feedError`, show non-blocking banner (auto-dismiss after 10 s)
    - Clear interval on unmount
    - _Requirements: 7.1, 7.4, 7.6_

  - [ ] 10.3 Wire `activeLevel` from shared state into FeedPanel
    - When user changes `ReadingLevelSelector`, all `FeedItem` components re-render to show the correct variant
    - _Requirements: 7.3, 7.7_

  - [ ] 10.4 Write property test for polling interval (Property 14)
    - **Property 14: Feed polling fires on the correct interval**
    - **Validates: Requirements 7.1**
    - `// Feature: crisis-text-simplifier, Property 14: Feed polling fires on the correct interval`
    - Generate elapsed time intervals; assert poll function call count matches interval count plus initial mount call

  - [ ] 10.5 Write property test for Feed_Item level rendering (Property 16)
    - **Property 16: Feed_Items display the active Reading_Level variant**
    - **Validates: Requirements 7.3, 7.7**
    - `// Feature: crisis-text-simplifier, Property 16: Feed_Items display the active Reading_Level variant`
    - Generate feed states and reading levels; assert each Feed_Item renders the correct variant

  - [ ] 10.6 Write property test for feed prepend (Property 17)
    - **Property 17: New Feed_Items are prepended without removing existing items**
    - **Validates: Requirements 7.4**
    - `// Feature: crisis-text-simplifier, Property 17: New Feed_Items are prepended without removing existing items`
    - Generate existing feed lists and new article batches; assert length is N+M and new items appear first

  - [ ] 10.7 Write property test for polling indicator (Property 18)
    - **Property 18: Polling indicator is shown during active poll**
    - **Validates: Requirements 7.5**
    - `// Feature: crisis-text-simplifier, Property 18: Polling indicator is shown during active poll`
    - Generate feed states with `isPolling=true`; assert polling indicator element is present

  - [ ] 10.8 Write property test for feed error preservation (Property 19)
    - **Property 19: Feed items are preserved on polling failure**
    - **Validates: Requirements 7.6**
    - `// Feature: crisis-text-simplifier, Property 19: Feed items are preserved on polling failure`
    - Generate feed states and polling failures; assert feed items unchanged and error banner visible

  - [ ] 10.9 Write unit tests for FeedPanel
    - Initial mount triggers poll; successful poll prepends items; failed poll shows non-blocking banner without clearing items; reading level change re-renders all Feed_Items
    - _Requirements: 7.1, 7.4, 7.6, 7.7_

- [ ] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (frontend/Node) and `Hypothesis` (Python backend); minimum 100 iterations each
- Every property test must include the comment tag: `// Feature: crisis-text-simplifier, Property {N}: {property_text}`
- Checkpoints ensure incremental validation before moving to the next phase

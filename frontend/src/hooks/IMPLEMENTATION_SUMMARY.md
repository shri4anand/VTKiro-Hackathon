# useTTS Hook Implementation Summary

## Task: 7.1 Implement `useTTS` hook using Web Speech API

### Files Created

1. **frontend/src/hooks/useTTS.ts** - Main hook implementation
2. **frontend/src/__tests__/unit/useTTS.test.ts** - Unit tests
3. **frontend/src/__tests__/property/useTTS.prop.test.ts** - Property-based tests
4. **frontend/src/hooks/README.md** - Usage documentation

### Implementation Details

#### Hook Signature
```typescript
function useTTS(): UseTTSReturn {
  play: (text: string, language: Language, level: ReadingLevel) => void;
  stop: () => void;
  isAvailable: boolean;
  error: string | null;
}
```

#### Key Features

1. **Web Speech API Integration**
   - Uses native `window.speechSynthesis` API
   - Fallback support for webkit prefix
   - Graceful degradation when API unavailable

2. **State Management**
   - Integrates with Redux-like app state via `useAppDispatch`
   - Sets `playingLevel` when playback starts
   - Clears `playingLevel` when playback ends or stops
   - Tracks errors in local ref

3. **Language Support**
   - Supports all required languages: en, es, fr, zh, ar, pt
   - Maps to appropriate Web Speech API language codes:
     - en → en-US
     - es → es-ES
     - fr → fr-FR
     - zh → zh-CN
     - ar → ar-SA
     - pt → pt-BR

4. **Error Handling**
   - Returns `isAvailable: false` when speechSynthesis unavailable
   - Sets error message "Audio unavailable for this variant." on TTS errors
   - Gracefully handles exceptions during play/stop

5. **Playback Control**
   - `play()` stops any existing playback before starting new
   - `stop()` cancels current playback and clears state
   - Automatic cleanup on component unmount

### Requirements Mapping

✅ **Requirement 4.1**: Play button provided via `play()` function
✅ **Requirement 4.2**: TTS called with correct text and language
✅ **Requirement 4.4**: Stop control halts playback via `stop()`
✅ **Requirement 4.5**: Error handling with "Audio unavailable for this variant." message

### Test Coverage

#### Unit Tests (8 tests)
- Availability detection (with/without speechSynthesis)
- Play functionality with correct utterance
- Language code mapping for all 6 languages
- Stop functionality
- Unavailable API handling
- Error handling
- Playback cancellation on new play
- Playback end handling

#### Property-Based Tests (5 properties, 100 runs each)
- **Property 7**: Play function always available when speechSynthesis available
- **Property 8**: TTS called with correct text and language for any valid combination
- **Property 9**: Stop function clears playingLevel during playback
- **Property 10**: Stop function can be called multiple times without error
- **Property 8 (extended)**: Language codes correctly set for all languages

### Integration Points

The hook integrates with:
- **App State**: Dispatches `SET_PLAYING_LEVEL` action
- **Types**: Uses `Language` and `ReadingLevel` types
- **Components**: Ready to be used in `SimplifiedCard` components for audio controls

### Next Steps

The hook is ready to be integrated into:
1. `SimplifiedCard` component (Task 7.2) - Add AudioControls
2. Error display logic - Show error messages on cards
3. UI controls - Hide play buttons when `isAvailable` is false

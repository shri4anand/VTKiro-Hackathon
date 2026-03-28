# Hooks

## useTTS

A React hook for text-to-speech functionality using the Web Speech API.

### Usage

```typescript
import { useTTS } from './hooks/useTTS';

function MyComponent() {
  const { play, stop, isAvailable, error } = useTTS();

  if (!isAvailable) {
    return <p>Text-to-speech is not available in this browser.</p>;
  }

  return (
    <div>
      <button onClick={() => play("Hello world", "en", "grade3")}>
        Play
      </button>
      <button onClick={stop}>Stop</button>
      {error && <p>{error}</p>}
    </div>
  );
}
```

### API

#### `play(text: string, language: Language, level: ReadingLevel): void`

Starts text-to-speech playback of the given text in the specified language.

- **text**: The text to speak
- **language**: One of `"en" | "es" | "fr" | "zh" | "ar" | "pt"`
- **level**: One of `"grade3" | "grade6" | "grade9"` (used to track which card is playing)

When playback starts, the hook dispatches `SET_PLAYING_LEVEL` with the provided level to the app state.

#### `stop(): void`

Stops the current playback and clears the `playingLevel` in app state.

#### `isAvailable: boolean`

Indicates whether the Web Speech API is available in the current browser.

#### `error: string | null`

Contains the error message if TTS fails, or `null` if no error has occurred.

### Behavior

- When `play()` is called, any existing playback is stopped first
- When playback starts, `playingLevel` is set to the provided level
- When playback ends naturally, `playingLevel` is cleared
- If an error occurs during playback, the error message is set and `playingLevel` is cleared
- On unmount, any active playback is stopped

### Error Handling

If TTS fails for any reason, the error message "Audio unavailable for this variant." is set and can be displayed to the user.

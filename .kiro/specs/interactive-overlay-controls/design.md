# Design Document: Interactive Overlay Controls

## Overview

This feature adds minimize/maximize functionality to both the Simplifier Panel and Feed Panel overlays. The design introduces panel state management, reduces default panel widths from 320px to 256px, and provides accessible controls for toggling between minimized (header-only) and maximized (full content) states.

The implementation focuses on:
- Independent state management for each panel
- Smooth CSS transitions between states
- Preservation of existing behaviors (opacity fade for Simplifier, polling for Feed)
- Full keyboard accessibility and screen reader support
- Minimal visual footprint when minimized (≤48px width)

## Architecture

### Component Structure

The feature introduces two new components and modifies the existing App.tsx layout:

```
App.tsx (modified)
├── SimplifierPanel (new wrapper component)
│   ├── PanelHeader (new)
│   │   ├── Title
│   │   └── MinimizeButton / MaximizeButton
│   └── PanelContent (conditional render)
│       ├── AlertInputPanel
│       ├── LanguageToggle
│       ├── ReadingLevelSelector
│       └── OutputPanel
│
└── FeedPanel (modified wrapper)
    ├── PanelHeader (new)
    │   ├── Title
    │   └── MinimizeButton / MaximizeButton
    └── PanelContent (conditional render)
        └── FeedPanel content (existing)
```

### State Management

Panel states will be managed in App.tsx using React useState hooks:

```typescript
const [isSimplifierMinimized, setIsSimplifierMinimized] = useState(false);
const [isFeedMinimized, setIsFeedMinimized] = useState(false);
```

This approach keeps panel UI state local to the App component rather than in global state, as it's purely presentational and doesn't need to be shared across the application.

### Styling Strategy

The design uses Tailwind CSS with conditional classes based on panel state:

- **Maximized state**: `w-64` (256px width)
- **Minimized state**: `w-12` (48px width)
- **Transitions**: `transition-all duration-300 ease-in-out`
- **Header orientation**: Vertical text in minimized state using `writing-mode: vertical-rl`

## Components and Interfaces

### SimplifierPanel Component

A new wrapper component that encapsulates the minimize/maximize logic for the Simplifier Panel.

```typescript
interface SimplifierPanelProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
  children: React.ReactNode;
}
```

**Responsibilities:**
- Render panel header with title and toggle button
- Apply conditional styling based on minimized state
- Manage opacity fade behavior (only when maximized)
- Handle focus/blur events for opacity transitions
- Conditionally render children based on state

### FeedPanelWrapper Component

A new wrapper component that encapsulates the minimize/maximize logic for the Feed Panel.

```typescript
interface FeedPanelWrapperProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  children: React.ReactNode;
}
```

**Responsibilities:**
- Render panel header with title and toggle button
- Apply conditional styling based on minimized state
- Conditionally render children based on state
- Maintain consistent styling with SimplifierPanel

### PanelToggleButton Component

A reusable button component for minimize/maximize actions.

```typescript
interface PanelToggleButtonProps {
  isMinimized: boolean;
  onClick: () => void;
  panelName: string; // For aria-label
}
```

**Responsibilities:**
- Render appropriate icon (ChevronLeft for minimize, ChevronRight/ChevronLeft for maximize)
- Provide accessible labels
- Handle keyboard interactions (Enter, Space)
- Apply hover/focus styles

## Data Models

### Panel State

```typescript
type PanelState = 'minimized' | 'maximized';

interface PanelUIState {
  simplifierMinimized: boolean;
  feedMinimized: boolean;
}
```

The panel state is represented as boolean flags rather than string enums for simplicity, as there are only two states and boolean values integrate naturally with React's useState.

### Modified App State

No changes to the global AppState type are required. Panel UI state remains local to App.tsx.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Panel toggle transitions state

*For any* panel (Simplifier or Feed), clicking the toggle button should transition the panel from its current state to the opposite state (minimized to maximized, or maximized to minimized).

**Validates: Requirements 2.3, 3.2**

### Property 2: Minimized panels show only header with maximize button

*For any* panel in minimized state, the rendered output should contain the panel header, the panel title, and a maximize button, but should not contain the panel's content components.

**Validates: Requirements 2.4, 3.1**

### Property 3: Minimized panels have constrained width

*For any* panel in minimized state, the panel width should be 48px or less.

**Validates: Requirements 2.5**

### Property 4: Maximized panels show full content

*For any* panel in maximized state, the rendered output should contain all panel content components and have a width of 256px.

**Validates: Requirements 3.3**

### Property 5: Panel control buttons have accessible labels

*For any* panel control button (minimize or maximize), the button should have an aria-label attribute that describes its action.

**Validates: Requirements 2.6, 3.4, 6.4**

### Property 6: Panel state persists across unrelated interactions

*For any* panel, after setting it to a specific state (minimized or maximized), performing unrelated UI interactions (changing language, reading level, or input text) should not change the panel's state.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 7: Panel states are independent

*For any* combination of panel states, toggling one panel's state should not affect the other panel's state.

**Validates: Requirements 4.4**

### Property 8: Panel controls display state-appropriate icons

*For any* panel, the toggle button should display a visual indicator (icon) that corresponds to the available action: a collapse/minimize icon when maximized, and an expand/maximize icon when minimized.

**Validates: Requirements 5.1, 5.2**

### Property 9: Panel control buttons are keyboard accessible

*For any* panel control button, the button should be focusable via Tab key and activatable via Enter or Space key, resulting in the same state change as a mouse click.

**Validates: Requirements 6.1, 6.2**

### Property 10: Panel state changes are announced to screen readers

*For any* panel, when the panel state changes from minimized to maximized or vice versa, the panel should update its aria-expanded attribute and/or trigger an aria-live announcement.

**Validates: Requirements 6.3**

### Property 11: Minimized panel content is hidden from assistive technology

*For any* panel in minimized state, the panel content should be hidden from screen readers using aria-hidden="true" or by not rendering it in the DOM.

**Validates: Requirements 6.5**

### Property 12: Feed polling continues in both states

*For any* Feed Panel state (minimized or maximized), the feed polling functionality should continue to execute at the configured interval.

**Validates: Requirements 7.3**

### Property 13: Panel positioning remains consistent across states

*For any* panel, transitioning between minimized and maximized states should not change the panel's z-index or position (top, left, right) values.

**Validates: Requirements 7.4**

## Error Handling

### Panel State Errors

The panel state management is purely UI-based and doesn't involve async operations or external dependencies. Error handling focuses on defensive programming:

1. **Invalid State Recovery**: If panel state becomes undefined or invalid, default to maximized state
2. **Event Handler Failures**: Wrap toggle handlers in try-catch to prevent UI crashes
3. **Focus Management**: Ensure focus is not lost when panels transition states

### Accessibility Errors

1. **Missing ARIA Attributes**: Validate that all required ARIA attributes are present during development
2. **Keyboard Trap Prevention**: Ensure focus can always move out of panels
3. **Screen Reader Compatibility**: Test with multiple screen readers (NVDA, JAWS, VoiceOver)

### CSS Transition Errors

1. **Browser Compatibility**: Use vendor prefixes if needed for older browsers
2. **Reduced Motion**: Respect `prefers-reduced-motion` media query for users with motion sensitivity
3. **Layout Shift**: Ensure transitions don't cause unexpected layout shifts

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Initial State**: Verify both panels start in maximized state on mount
2. **Button Presence**: Verify minimize button exists in maximized panels
3. **Button Presence**: Verify maximize button exists in minimized panels
4. **Simplifier Opacity**: Verify opacity fade works when maximized
5. **Simplifier Opacity**: Verify opacity fade is disabled when minimized
6. **Panel Width**: Verify panels have w-64 class when maximized
7. **Panel Width**: Verify panels have w-12 class when minimized
8. **Transition Classes**: Verify transition CSS classes are applied
9. **Hover Feedback**: Verify hover classes are applied to buttons
10. **Scroll Behavior**: Verify scroll works in maximized panels with overflow content

### Property-Based Testing

Property tests will verify universal behaviors across all inputs using fast-check library (minimum 100 iterations per test):

Each property test will:
- Generate random panel states and user interactions
- Verify the property holds across all generated scenarios
- Reference the corresponding design property in a comment tag

**Test Configuration:**
- Library: fast-check (already used in the project)
- Iterations: 100 minimum per property
- Tag format: `// Feature: interactive-overlay-controls, Property {number}: {property_text}`

**Property Test Coverage:**

1. **Property 1**: Generate random sequences of toggle clicks, verify state alternates correctly
2. **Property 2**: Generate random panel states, verify minimized panels only show header
3. **Property 3**: Generate random panel states, verify minimized width constraint
4. **Property 4**: Generate random panel states, verify maximized panels show full content
5. **Property 5**: Generate random panel types and states, verify aria-labels exist
6. **Property 6**: Generate random UI interactions, verify panel states persist
7. **Property 7**: Generate random toggle sequences, verify panel independence
8. **Property 8**: Generate random panel states, verify correct icons displayed
9. **Property 9**: Generate random keyboard events, verify accessibility
10. **Property 10**: Generate random state changes, verify aria-expanded updates
11. **Property 11**: Generate random panel states, verify content hidden when minimized
12. **Property 12**: Generate random panel states, verify polling continues
13. **Property 13**: Generate random state transitions, verify positioning consistency

### Integration Testing

Integration tests will verify the feature works correctly with existing functionality:

1. **Simplifier Workflow**: Verify text simplification works with panels in various states
2. **Feed Polling**: Verify feed updates appear correctly when panel is minimized then maximized
3. **Map Interaction**: Verify map remains interactive with panels in various states
4. **Language Toggle**: Verify language changes work with panels minimized
5. **Reading Level**: Verify reading level changes work with panels minimized

### Accessibility Testing

Manual testing with assistive technologies:

1. **Screen Readers**: Test with NVDA (Windows), JAWS (Windows), VoiceOver (macOS)
2. **Keyboard Navigation**: Verify all controls are reachable and operable via keyboard
3. **Focus Indicators**: Verify focus indicators are visible on all interactive elements
4. **Reduced Motion**: Test with `prefers-reduced-motion` enabled

### Visual Regression Testing

Verify visual consistency across states:

1. **Panel Transitions**: Capture screenshots of transition states
2. **Responsive Layout**: Test at various viewport sizes
3. **Icon Rendering**: Verify icons render correctly in both states
4. **Z-index Layering**: Verify panels layer correctly over map


# Feed Panel Transparency Bugfix Design

## Overview

The FeedPanelWrapper component lacks the transparency behavior that exists in SimplifierPanel, creating an inconsistent user experience. When maximized, the feed panel should become slightly transparent (opacity-40) when not being interacted with, and restore full opacity (opacity-100) when hovered or focused. This fix will add focus state management and event handlers to FeedPanelWrapper, mirroring the existing implementation in SimplifierPanel.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the feed panel is maximized and not being interacted with (no hover, no focus)
- **Property (P)**: The desired behavior - the panel should have reduced opacity (opacity-40) when not interacted with, and full opacity (opacity-100) when hovered or focused
- **Preservation**: Existing panel behaviors that must remain unchanged - minimize/maximize toggle, content rendering, smooth transitions, and all user interactions
- **FeedPanelWrapper**: The component in `frontend/src/components/FeedPanelWrapper.tsx` that wraps the crisis feed panel
- **SimplifierPanel**: The reference component in `frontend/src/components/SimplifierPanel.tsx` that already implements the correct transparency behavior
- **isFocused**: State property that tracks whether the panel is being interacted with (hovered or has focus within)

## Bug Details

### Bug Condition

The bug manifests when the feed panel is maximized and the user is not hovering over it or focusing any element within it. The FeedPanelWrapper component is missing the focus state management (isFocused prop and onFocusChange callback) and the corresponding event handlers (onMouseEnter, onMouseLeave, onFocus, onBlur) that control the transparency effect.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { isMinimized: boolean, isHovered: boolean, hasFocusWithin: boolean }
  OUTPUT: boolean
  
  RETURN input.isMinimized == false
         AND input.isHovered == false
         AND input.hasFocusWithin == false
         AND currentOpacity == 100
END FUNCTION
```

### Examples

- User maximizes the feed panel and moves mouse away - panel remains fully opaque (should be opacity-40)
- User clicks outside the feed panel after reading it - panel remains fully opaque (should be opacity-40)
- User hovers over the feed panel - panel is fully opaque (correct, should remain opacity-100)
- User minimizes the feed panel - panel is fully opaque (correct, should remain opacity-100)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Minimize/maximize toggle functionality must continue to work exactly as before
- Panel content rendering and layout must remain unchanged
- Smooth transition animations between states must remain unchanged
- All user interactions with feed items (clicks, keyboard navigation) must continue to work
- Panel positioning (top-4 right-4) and sizing must remain unchanged
- Accessibility attributes (aria-expanded) must remain unchanged

**Scope:**
All inputs that do NOT involve the transparency effect should be completely unaffected by this fix. This includes:
- Toggle button clicks
- Feed item interactions
- Panel scrolling behavior
- Content updates from feed polling
- Panel width transitions during minimize/maximize

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is clear:

1. **Missing Props**: FeedPanelWrapper does not accept `isFocused` and `onFocusChange` props that SimplifierPanel uses
   - SimplifierPanel has: `isFocused: boolean` and `onFocusChange: (focused: boolean) => void`
   - FeedPanelWrapper only has: `isMinimized`, `onToggleMinimize`, `children`

2. **Missing Event Handlers**: FeedPanelWrapper does not have the mouse and focus event handlers
   - SimplifierPanel has: `onMouseEnter`, `onMouseLeave`, `onFocus`, `onBlur`
   - FeedPanelWrapper has no interaction event handlers

3. **Missing CSS Classes**: FeedPanelWrapper does not apply the conditional opacity classes
   - SimplifierPanel has: `!isMinimized && (isFocused ? 'opacity-100' : 'opacity-40 hover:opacity-100')`
   - FeedPanelWrapper has no opacity-related classes

4. **Missing Parent State**: App.tsx does not manage focus state for FeedPanelWrapper
   - App.tsx has: `isSimplifierFocused` state and `setIsSimplifierFocused` handler
   - App.tsx does not have equivalent state for feed panel

## Correctness Properties

Property 1: Bug Condition - Transparency When Not Interacting

_For any_ state where the feed panel is maximized and the user is not hovering over it and no element within it has focus, the FeedPanelWrapper SHALL apply reduced opacity (opacity-40 class), and when the user hovers over the panel, it SHALL restore full opacity (opacity-100 class via hover:opacity-100).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Existing Panel Behavior

_For any_ interaction that does NOT involve the transparency effect (minimize/maximize toggle, content rendering, feed item clicks, scrolling), the fixed FeedPanelWrapper SHALL produce exactly the same behavior as the original component, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

The fix requires changes to two files, following the exact pattern used in SimplifierPanel:

**File**: `frontend/src/components/FeedPanelWrapper.tsx`

**Specific Changes**:
1. **Add Props**: Extend the `FeedPanelWrapperProps` interface
   - Add `isFocused: boolean` prop
   - Add `onFocusChange: (focused: boolean) => void` prop

2. **Add Event Handlers**: Add mouse and focus event handlers to the root div
   - `onMouseEnter={() => !isMinimized && onFocusChange(true)}`
   - `onMouseLeave={() => !isMinimized && onFocusChange(false)}`
   - `onFocus={() => !isMinimized && onFocusChange(true)}`
   - `onBlur={(e) => { if (!isMinimized && !e.currentTarget.contains(e.relatedTarget as Node)) { onFocusChange(false); } }}`

3. **Add CSS Classes**: Add conditional opacity classes to the root div className
   - Add: `${!isMinimized && (isFocused ? 'opacity-100' : 'opacity-40 hover:opacity-100')}`
   - Add: `${isMinimized ? 'opacity-100' : ''}` (explicit opacity when minimized)

**File**: `frontend/src/App.tsx`

**Specific Changes**:
1. **Add State**: Add focus state management for feed panel
   - Add: `const [isFeedFocused, setIsFeedFocused] = React.useState(false);`

2. **Pass Props**: Pass the new props to FeedPanelWrapper
   - Add `isFocused={isFeedFocused}` prop
   - Add `onFocusChange={setIsFeedFocused}` prop

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the feed panel lacks transparency behavior while the simplifier panel has it.

**Test Plan**: Write tests that render FeedPanelWrapper in maximized state, simulate mouse leave and blur events, and assert that opacity changes occur. Run these tests on the UNFIXED code to observe failures and confirm the root cause.

**Test Cases**:
1. **Maximized Without Interaction**: Render maximized feed panel, verify it has opacity-40 class (will fail on unfixed code)
2. **Hover Restores Opacity**: Render maximized feed panel, simulate mouseEnter, verify opacity-100 (will fail on unfixed code)
3. **Focus Restores Opacity**: Render maximized feed panel, focus an element within, verify opacity-100 (will fail on unfixed code)
4. **Minimized Always Opaque**: Render minimized feed panel, verify it has opacity-100 regardless of interaction (should pass on unfixed code)

**Expected Counterexamples**:
- FeedPanelWrapper does not have opacity-40 class when maximized and not interacted with
- FeedPanelWrapper does not respond to hover or focus events
- Possible causes: missing props, missing event handlers, missing CSS classes

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := FeedPanelWrapper_fixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT FeedPanelWrapper_original(input) = FeedPanelWrapper_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-transparency interactions

**Test Plan**: Observe behavior on UNFIXED code first for minimize/maximize toggle, content rendering, and feed item interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Toggle Preservation**: Observe that minimize/maximize toggle works correctly on unfixed code, then write test to verify this continues after fix
2. **Content Rendering Preservation**: Observe that feed content renders correctly on unfixed code, then write test to verify this continues after fix
3. **Interaction Preservation**: Observe that feed item clicks and keyboard navigation work on unfixed code, then write test to verify this continues after fix
4. **Transition Preservation**: Observe that panel transitions animate smoothly on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test that FeedPanelWrapper applies opacity-40 when maximized and not interacted with
- Test that hover restores opacity-100
- Test that focus within restores opacity-100
- Test that minimized panel always has opacity-100
- Test that toggle button continues to work
- Test that content renders correctly in both states

### Property-Based Tests

- Generate random interaction sequences (hover, focus, blur, toggle) and verify opacity state is always correct
- Generate random panel states and verify that non-transparency behaviors (content rendering, positioning) are preserved
- Test that all combinations of isMinimized and isFocused produce correct opacity classes

### Integration Tests

- Test full user flow: maximize panel, read feed, move mouse away (panel fades), hover again (panel restores)
- Test switching between simplifier and feed panels with transparency effects
- Test that both panels have consistent transparency behavior
- Test keyboard navigation through feed items with focus-based opacity changes

# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Feed Panel Transparency When Not Interacting
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case - maximized feed panel with no hover/focus
  - Test that FeedPanelWrapper applies opacity-40 when maximized and not interacted with (from Bug Condition in design)
  - Test that hover restores opacity-100 via hover:opacity-100 class
  - Test that focus within restores opacity-100
  - The test assertions should match the Expected Behavior Properties from design (requirements 2.1, 2.2, 2.3, 2.4)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: FeedPanelWrapper lacks opacity-40 class, missing event handlers, missing isFocused prop
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Panel Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-transparency interactions
  - Observe: minimize/maximize toggle works correctly on unfixed code
  - Observe: feed content renders correctly on unfixed code
  - Observe: feed item clicks and keyboard navigation work on unfixed code
  - Observe: panel transitions animate smoothly on unfixed code
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Test that minimize/maximize toggle continues to work exactly as before
  - Test that panel content rendering and layout remain unchanged
  - Test that all user interactions with feed items continue to work
  - Test that panel positioning and sizing remain unchanged
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Fix for feed panel transparency

  - [x] 3.1 Implement the fix in FeedPanelWrapper.tsx
    - Add `isFocused: boolean` prop to FeedPanelWrapperProps interface
    - Add `onFocusChange: (focused: boolean) => void` prop to FeedPanelWrapperProps interface
    - Add event handlers to root div: onMouseEnter, onMouseLeave, onFocus, onBlur
    - Add conditional opacity classes: `${!isMinimized && (isFocused ? 'opacity-100' : 'opacity-40 hover:opacity-100')}`
    - Ensure minimized panel always has opacity-100
    - _Bug_Condition: isBugCondition(input) where input.isMinimized == false AND input.isHovered == false AND input.hasFocusWithin == false_
    - _Expected_Behavior: Panel has opacity-40 when not interacted with, opacity-100 when hovered or focused (from design)_
    - _Preservation: Minimize/maximize toggle, content rendering, smooth transitions, all user interactions must remain unchanged (from design)_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Add focus state management in App.tsx
    - Add state: `const [isFeedFocused, setIsFeedFocused] = React.useState(false);`
    - Pass `isFocused={isFeedFocused}` prop to FeedPanelWrapper
    - Pass `onFocusChange={setIsFeedFocused}` prop to FeedPanelWrapper
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Feed Panel Transparency When Not Interacting
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Panel Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [-] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

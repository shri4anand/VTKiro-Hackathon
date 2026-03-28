# Implementation Plan: Interactive Overlay Controls

## Overview

This implementation adds minimize/maximize controls to the Simplifier Panel and Feed Panel overlays. The approach focuses on creating reusable panel wrapper components with independent state management, reducing default panel widths from 320px to 256px, and ensuring full accessibility support. The implementation will be incremental, starting with core components, then integrating them into the existing panels, and finally adding property-based tests to validate correctness properties.

## Tasks

- [x] 1. Create PanelToggleButton component
  - Create `frontend/src/components/PanelToggleButton.tsx`
  - Implement button with minimize/maximize icons (ChevronLeft/ChevronRight from lucide-react or similar)
  - Add aria-label based on panel name and current state
  - Add keyboard event handlers (Enter, Space)
  - Add hover and focus styles with Tailwind
  - _Requirements: 2.6, 3.4, 6.1, 6.2, 6.4_

- [ ]* 1.1 Write property test for PanelToggleButton accessibility
  - **Property 5: Panel control buttons have accessible labels**
  - **Property 9: Panel control buttons are keyboard accessible**
  - **Validates: Requirements 2.6, 3.4, 6.1, 6.2, 6.4**

- [x] 2. Create SimplifierPanel wrapper component
  - Create `frontend/src/components/SimplifierPanel.tsx`
  - Accept `isMinimized`, `onToggleMinimize`, `isFocused`, `onFocusChange`, and `children` props
  - Render panel header with title "Crisis Text Simplifier" and PanelToggleButton
  - Apply conditional width classes: `w-64` when maximized, `w-12` when minimized
  - Apply transition classes: `transition-all duration-300 ease-in-out`
  - Conditionally render children only when maximized
  - Apply opacity fade behavior only when maximized (using isFocused prop)
  - Add aria-expanded attribute based on minimized state
  - Use vertical text orientation for title when minimized (`writing-mode: vertical-rl`)
  - _Requirements: 1.1, 2.1, 2.3, 2.4, 2.5, 3.2, 3.3, 5.3, 6.3, 7.1, 7.2_

- [ ]* 2.1 Write property tests for SimplifierPanel
  - **Property 2: Minimized panels show only header with maximize button**
  - **Property 3: Minimized panels have constrained width**
  - **Property 4: Maximized panels show full content**
  - **Property 8: Panel controls display state-appropriate icons**
  - **Property 10: Panel state changes are announced to screen readers**
  - **Property 11: Minimized panel content is hidden from assistive technology**
  - **Validates: Requirements 2.4, 2.5, 3.1, 3.3, 5.1, 5.2, 6.3, 6.5_

- [-] 3. Create FeedPanelWrapper component
  - Create `frontend/src/components/FeedPanelWrapper.tsx`
  - Accept `isMinimized`, `onToggleMinimize`, and `children` props
  - Render panel header with title "Crisis Feed" and PanelToggleButton
  - Apply conditional width classes: `w-64` when maximized, `w-12` when minimized
  - Apply transition classes: `transition-all duration-300 ease-in-out`
  - Conditionally render children only when maximized
  - Add aria-expanded attribute based on minimized state
  - Use vertical text orientation for title when minimized (`writing-mode: vertical-rl`)
  - _Requirements: 1.2, 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 5.3, 6.3_

- [ ]* 3.1 Write property tests for FeedPanelWrapper
  - **Property 2: Minimized panels show only header with maximize button**
  - **Property 3: Minimized panels have constrained width**
  - **Property 4: Maximized panels show full content**
  - **Property 8: Panel controls display state-appropriate icons**
  - **Property 10: Panel state changes are announced to screen readers**
  - **Property 11: Minimized panel content is hidden from assistive technology**
  - **Validates: Requirements 2.4, 2.5, 3.1, 3.3, 5.1, 5.2, 6.3, 6.5_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Integrate SimplifierPanel into App.tsx
  - Import SimplifierPanel component
  - Wrap existing Simplifier Panel content with SimplifierPanel component
  - Pass `isSimplifierMinimized` and `setIsSimplifierMinimized` state
  - Pass `isSimplifierFocused` and `setIsSimplifierFocused` for opacity behavior
  - Move existing panel content (AlertInputPanel, LanguageToggle, ReadingLevelSelector, OutputPanel) into SimplifierPanel children
  - Remove hardcoded width `w-80` from the panel div (now controlled by SimplifierPanel)
  - Ensure initial state is maximized (isSimplifierMinimized = false)
  - _Requirements: 1.1, 4.1, 4.2, 7.1, 7.2, 8.1_

- [ ] 6. Integrate FeedPanelWrapper into App.tsx
  - Import FeedPanelWrapper component
  - Wrap existing Feed Panel with FeedPanelWrapper component
  - Pass `isFeedMinimized` and `setIsFeedMinimized` state
  - Move FeedPanel component into FeedPanelWrapper children
  - Remove hardcoded width `w-80` from the panel div (now controlled by FeedPanelWrapper)
  - Ensure initial state is maximized (isFeedMinimized = false)
  - _Requirements: 1.2, 4.1, 4.2, 8.2_

- [ ]* 6.1 Write property tests for panel state management
  - **Property 1: Panel toggle transitions state**
  - **Property 6: Panel state persists across unrelated interactions**
  - **Property 7: Panel states are independent**
  - **Validates: Requirements 2.3, 3.2, 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Add reduced motion support
  - Add `prefers-reduced-motion` media query handling to panel transition styles
  - Update SimplifierPanel and FeedPanelWrapper to disable transitions when user prefers reduced motion
  - _Requirements: 5.3_

- [ ]* 8.1 Write property test for feed polling continuity
  - **Property 12: Feed polling continues in both states**
  - **Validates: Requirements 7.3_

- [ ]* 8.2 Write property test for panel positioning consistency
  - **Property 13: Panel positioning remains consistent across states**
  - **Validates: Requirements 7.4_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check library with minimum 100 iterations
- All property tests should include comment tags: `// Feature: interactive-overlay-controls, Property {N}: {title}`
- The design uses TypeScript with React and Tailwind CSS
- Icons can use lucide-react (ChevronLeft, ChevronRight) or similar icon library
- Checkpoints ensure incremental validation and provide opportunities for user feedback

# Requirements Document

## Introduction

This feature adds minimize/maximize controls to the Simplifier Panel and Feed Panel overlays, allowing users to toggle between a minimized state (showing only a header/restore button) and a maximized state (showing full content). The default size of both panels will be reduced to improve map visibility, and users will have explicit control over panel visibility.

## Glossary

- **Simplifier_Panel**: The left-side overlay containing the Crisis Text Simplifier interface (input, language toggle, reading level selector, and output)
- **Feed_Panel**: The right-side overlay containing the Crisis Feed with news articles
- **Minimized_State**: A collapsed panel state showing only a header bar with a restore/maximize button
- **Maximized_State**: An expanded panel state showing the full panel content
- **Panel_Control**: A button or interactive element that toggles between minimized and maximized states
- **Map_View**: The underlying map component displaying crisis events and feed item locations

## Requirements

### Requirement 1: Reduce Default Panel Width

**User Story:** As a user, I want smaller overlay panels by default, so that I can see more of the map without manual adjustments.

#### Acceptance Criteria

1. THE Simplifier_Panel SHALL have a default width of 256px (w-64 in Tailwind) instead of 320px
2. THE Feed_Panel SHALL have a default width of 256px (w-64 in Tailwind) instead of 320px
3. WHEN both panels are in maximized state, THE Map_View SHALL remain visible between the panels

### Requirement 2: Minimize Panel Controls

**User Story:** As a user, I want to minimize overlay panels, so that I can view the map without obstruction.

#### Acceptance Criteria

1. THE Simplifier_Panel SHALL display a minimize button in its header
2. THE Feed_Panel SHALL display a minimize button in its header
3. WHEN a user clicks the minimize button, THE panel SHALL transition to minimized state within 300ms
4. WHEN a panel is in minimized state, THE panel SHALL display only a header bar with the panel title and a maximize button
5. WHEN a panel is in minimized state, THE panel width SHALL be 48px or less
6. THE minimize button SHALL have an accessible label describing its action

### Requirement 3: Maximize Panel Controls

**User Story:** As a user, I want to restore minimized panels to full size, so that I can interact with panel content when needed.

#### Acceptance Criteria

1. WHEN a panel is in minimized state, THE panel SHALL display a maximize button
2. WHEN a user clicks the maximize button, THE panel SHALL transition to maximized state within 300ms
3. WHEN a panel transitions to maximized state, THE panel SHALL restore its full width and display all content
4. THE maximize button SHALL have an accessible label describing its action

### Requirement 4: Preserve Panel State

**User Story:** As a user, I want panel states to persist during my session, so that my preferred layout is maintained as I interact with the application.

#### Acceptance Criteria

1. WHEN a user minimizes a panel, THE panel SHALL remain minimized until explicitly maximized
2. WHEN a user maximizes a panel, THE panel SHALL remain maximized until explicitly minimized
3. WHEN a user interacts with other UI elements, THE panel states SHALL remain unchanged
4. THE Simplifier_Panel state SHALL be independent of the Feed_Panel state

### Requirement 5: Visual Feedback for Panel State

**User Story:** As a user, I want clear visual indicators of panel state, so that I understand which panels are minimized or maximized.

#### Acceptance Criteria

1. WHEN a panel is in minimized state, THE panel SHALL display a visual indicator (icon or text) showing it can be expanded
2. WHEN a panel is in maximized state, THE minimize button SHALL display a visual indicator (icon or text) showing it can be collapsed
3. THE panel transition between states SHALL use smooth CSS transitions
4. WHEN hovering over panel controls, THE controls SHALL provide visual feedback (color change or scale)

### Requirement 6: Accessibility for Panel Controls

**User Story:** As a user relying on assistive technology, I want panel controls to be keyboard accessible and properly announced, so that I can control panel visibility independently.

#### Acceptance Criteria

1. THE minimize button SHALL be keyboard focusable and activatable via Enter or Space key
2. THE maximize button SHALL be keyboard focusable and activatable via Enter or Space key
3. WHEN a panel state changes, THE panel SHALL announce its new state to screen readers via aria-live or aria-expanded
4. THE panel controls SHALL have aria-label attributes describing their function
5. WHEN a panel is minimized, THE panel content SHALL be hidden from screen readers using aria-hidden or display:none

### Requirement 7: Maintain Existing Panel Behaviors

**User Story:** As a user, I want existing panel features to continue working, so that the new controls enhance rather than disrupt my workflow.

#### Acceptance Criteria

1. WHEN the Simplifier_Panel is in maximized state, THE panel SHALL maintain its opacity fade behavior on focus/blur
2. WHEN the Simplifier_Panel is in minimized state, THE opacity fade behavior SHALL not apply
3. THE Feed_Panel polling functionality SHALL continue regardless of panel state
4. WHEN a panel is minimized, THE panel SHALL maintain its z-index and positioning
5. THE panel scroll behavior SHALL function normally when panels are in maximized state

### Requirement 8: Initial Panel State

**User Story:** As a user, I want panels to start in a sensible default state, so that I can begin using the application immediately.

#### Acceptance Criteria

1. WHEN the application loads, THE Simplifier_Panel SHALL be in maximized state
2. WHEN the application loads, THE Feed_Panel SHALL be in maximized state
3. THE initial panel states SHALL provide immediate access to both simplifier and feed functionality

# Bugfix Requirements Document

## Introduction

The Crisis Feed panel currently displays as a fixed overlay on the right side of the screen. When users tap map markers to view event details, the EventDetailPanel opens in the same screen area and gets blocked by the Crisis Feed, preventing users from reading event information. This creates a critical usability issue where users cannot access the primary functionality of viewing event details without the feed obstructing their view.

This bugfix introduces interactive minimize/maximize controls to the Crisis Feed panel, allowing users to collapse it when viewing event details and expand it when needed.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user taps a map marker to open the EventDetailPanel THEN the Crisis Feed panel remains at full width and overlaps the event details, blocking content

1.2 WHEN the EventDetailPanel is open THEN the user cannot interact with both the feed and event details simultaneously due to overlapping UI elements

1.3 WHEN the Crisis Feed is displayed THEN there are no controls to minimize or hide the panel, forcing it to remain visible at all times

### Expected Behavior (Correct)

2.1 WHEN a user taps a map marker to open the EventDetailPanel THEN the Crisis Feed SHALL provide a minimize control that allows users to collapse the panel and view event details without obstruction

2.2 WHEN the Crisis Feed is minimized THEN the EventDetailPanel SHALL be fully visible and accessible without any overlapping content

2.3 WHEN the Crisis Feed is minimized THEN the panel SHALL display a maximize control that allows users to restore the full feed view

2.4 WHEN the user toggles between minimized and maximized states THEN the transition SHALL be smooth and the panel state SHALL persist during the session

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the Crisis Feed is maximized THEN the system SHALL CONTINUE TO display all feed items with their full content and functionality

3.2 WHEN feed items are updated via polling THEN the system SHALL CONTINUE TO update the feed content regardless of whether the panel is minimized or maximized

3.3 WHEN the EventDetailPanel is not open THEN the Crisis Feed SHALL CONTINUE TO function normally in its default maximized state

3.4 WHEN users interact with feed items (clicking, scrolling) THEN the system SHALL CONTINUE TO respond to these interactions as before

3.5 WHEN the Simplifier panel is displayed THEN it SHALL CONTINUE TO function independently without being affected by Crisis Feed minimize/maximize state

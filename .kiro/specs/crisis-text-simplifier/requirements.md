# Requirements Document

## Introduction

The AI Crisis Text Simplifier is a web application that takes emergency alerts and crisis communications and rewrites them into accessible formats. It targets people with low literacy, non-native speakers, and users with cognitive disabilities — groups that are often underserved during emergencies when clear communication matters most.

Users paste any alert text into the app, and the system produces simplified versions at multiple reading levels, translations into selected languages, and audio playback of the simplified content.

## Glossary

- **Simplifier**: The AI-powered backend service responsible for rewriting input text
- **Alert_Input**: The raw emergency or crisis text provided by the user
- **Simplified_Output**: The rewritten version of the Alert_Input at a specified reading level
- **Reading_Level**: A grade-level classification (e.g., Grade 3, Grade 6, Grade 9) used to calibrate output complexity
- **Language_Toggle**: The UI control that allows users to select an output language
- **TTS_Engine**: The text-to-speech service that converts Simplified_Output to audio
- **LLM**: The large language model used by the Simplifier to rewrite text
- **Readability_Score**: A computed metric (e.g., Flesch-Kincaid) used to verify output complexity
- **Feed**: The continuously updated list of simplified crisis and emergency news articles displayed to the user
- **Feed_Item**: A single news article that has been processed by the Simplifier and is displayed in the Feed
- **Polling_Cycle**: A single scheduled attempt by the Feed to retrieve new articles from the news source
- **Map**: The full-screen interactive geographic map that serves as the central UI element of the situational awareness view
- **Map_Event**: A crisis or emergency event with geographic coordinates, displayed as a marker on the Map
- **Event_Marker**: A visual pin or icon placed on the Map at the coordinates of a Map_Event
- **Event_Detail_Panel**: The sidebar or overlay UI element that displays full details of a selected Map_Event
- **Severity_Level**: A classification of a Map_Event's urgency (e.g., low, medium, high, critical), used for color-coding Event_Markers
- **Deep_Link**: A URL that encodes a selected Map_Event or map position so the view can be restored from the URL alone
- **Map_Dataset**: The collection of Map_Event records loaded by the Map, initially sourced from a static mock JSON file
- **Map_View**: The current visible region of the Map defined by center coordinates and zoom level

---

## Requirements

### Requirement 1: Text Input

**User Story:** As a user, I want to paste emergency alert text into the app, so that I can have it simplified for easier understanding.

#### Acceptance Criteria

1. THE App SHALL provide a text input area that accepts plain text up to 5,000 characters.
2. WHEN the user submits an empty input, THE App SHALL display an inline validation message indicating that text is required.
3. WHEN the input exceeds 5,000 characters, THE App SHALL display an inline validation message indicating the character limit has been exceeded.
4. WHEN the user submits valid Alert_Input, THE App SHALL pass the text to the Simplifier for processing.

---

### Requirement 2: Reading Level Simplification

**User Story:** As a user with low literacy or a cognitive disability, I want the alert rewritten at a simpler reading level, so that I can understand what action to take.

#### Acceptance Criteria

1. THE Simplifier SHALL produce Simplified_Output at three Reading_Levels: Grade 3, Grade 6, and Grade 9.
2. WHEN the Simplifier produces a Simplified_Output, THE App SHALL display all three Reading_Level variants simultaneously.
3. THE Simplifier SHALL preserve all critical safety information (locations, times, required actions) present in the Alert_Input across all Reading_Level variants.
4. WHEN the Simplifier receives Alert_Input, THE Simplifier SHALL return all three Simplified_Output variants within 10 seconds under normal load.
5. THE Grade_3 Simplified_Output SHALL achieve a Flesch-Kincaid Grade Level score of 4.0 or below.
6. THE Grade_6 Simplified_Output SHALL achieve a Flesch-Kincaid Grade Level score between 4.1 and 7.0.
7. THE Grade_9 Simplified_Output SHALL achieve a Flesch-Kincaid Grade Level score between 7.1 and 10.0.

---

### Requirement 3: Multi-Language Translation

**User Story:** As a non-native English speaker, I want the simplified alert translated into my language, so that I can understand the emergency information.

#### Acceptance Criteria

1. THE App SHALL support translation into at least the following languages: Spanish, French, Mandarin Chinese, Arabic, and Portuguese.
2. WHEN the user selects a language via the Language_Toggle, THE App SHALL display the Simplified_Output in the selected language for all three Reading_Levels.
3. WHEN a translation is requested, THE Simplifier SHALL return translated output within 10 seconds under normal load.
4. WHEN the user switches languages, THE App SHALL update all displayed Simplified_Output variants without requiring a new submission.
5. IF a translation request fails, THEN THE App SHALL display an error message and retain the previously displayed output.

---

### Requirement 4: Audio Playback

**User Story:** As a user with a visual impairment or reading difficulty, I want to hear the simplified alert read aloud, so that I can receive the information without reading.

#### Acceptance Criteria

1. THE App SHALL provide a play button for each Simplified_Output variant.
2. WHEN the user activates a play button, THE TTS_Engine SHALL read the corresponding Simplified_Output aloud.
3. WHILE audio is playing, THE App SHALL display a visual indicator showing that playback is active.
4. WHEN the user activates a stop control, THE TTS_Engine SHALL stop playback immediately.
5. IF the TTS_Engine fails to produce audio, THEN THE App SHALL display an error message indicating that audio is unavailable.
6. THE TTS_Engine SHALL use the same language as the currently selected Language_Toggle output.

---

### Requirement 5: Accessibility

**User Story:** As a user with a disability, I want the interface to be operable with assistive technologies, so that I can use the app regardless of my abilities.

#### Acceptance Criteria

1. THE App SHALL be fully operable using keyboard navigation alone.
2. THE App SHALL provide visible focus indicators on all interactive elements.
3. THE App SHALL include ARIA labels on all interactive controls, including the Language_Toggle, play buttons, and submit button.
4. THE App SHALL maintain a color contrast ratio of at least 4.5:1 for all text elements against their backgrounds.
5. WHEN the Simplifier is processing a request, THE App SHALL communicate the loading state to screen readers via an ARIA live region.
6. WHEN a Simplified_Output is rendered, THE App SHALL announce the update to screen readers via an ARIA live region.

---

### Requirement 7: Automated News Feed

**User Story:** As a user, I want a feed that automatically pulls in new crisis and emergency news articles every 5 minutes and displays them in simplified form, so that I can stay informed without manually searching for updates.

#### Acceptance Criteria

1. THE Feed SHALL poll a news source for crisis and emergency articles on a 5-minute interval.
2. WHEN new articles are retrieved, THE Feed SHALL pass each article's text to the Simplifier for processing at all three Reading_Levels.
3. THE Feed SHALL display each processed article as a Feed_Item showing the Simplified_Output at the user's currently active Reading_Level.
4. WHEN a new polling cycle completes and new articles are found, THE Feed SHALL prepend the new Feed_Items to the top of the feed without removing existing Feed_Items.
5. WHILE a polling cycle is in progress, THE Feed SHALL display a visual indicator that a refresh is occurring.
6. IF a polling request fails, THEN THE Feed SHALL retain the existing Feed_Items and display a non-blocking error message indicating that the feed could not be refreshed.
7. WHEN the user selects a Reading_Level, THE Feed SHALL update all displayed Feed_Items to show the Simplified_Output at the newly selected Reading_Level.
8. THE Feed SHALL apply the same Reading_Level Flesch-Kincaid score constraints defined in Requirement 2 to all Feed_Item Simplified_Output variants.

---

### Requirement 6: Error Handling and Resilience

**User Story:** As a user, I want the app to handle failures gracefully, so that I am not left with a broken or confusing interface during an emergency.

#### Acceptance Criteria

1. IF the LLM service is unavailable, THEN THE App SHALL display a clear error message and provide a retry option.
2. IF a network request times out after 15 seconds, THEN THE App SHALL cancel the request and display a timeout error message.
3. WHEN an error occurs, THE App SHALL preserve the Alert_Input so the user does not need to re-enter it.
4. IF the Simplifier returns a malformed response, THEN THE App SHALL log the error and display a generic error message to the user.

---

### Requirement 8: Interactive Geographic Map

**User Story:** As a user, I want a full-screen interactive map as the central UI element, so that I can visually explore crisis events by geographic location.

#### Acceptance Criteria

1. THE Map SHALL render as the primary full-screen UI element, occupying the full viewport width and height.
2. THE Map SHALL support pan and zoom interactions via mouse, touch, and keyboard controls.
3. THE Map SHALL use a dark-mode tile style by default.
4. THE Map SHALL be responsive and render correctly on both desktop and mobile viewport sizes.
5. WHEN the Map is first loaded, THE Map SHALL initialize to a default center coordinate and zoom level that provides a global overview.

---

### Requirement 9: Event Markers

**User Story:** As a user, I want to see crisis events pinned to the map as markers, so that I can quickly identify where events are occurring.

#### Acceptance Criteria

1. THE Map SHALL display an Event_Marker at the latitude and longitude of each Map_Event in the Map_Dataset.
2. THE Event_Marker SHALL be color-coded according to the Severity_Level of its Map_Event: low (green), medium (yellow), high (orange), critical (red).
3. WHEN the user clicks an Event_Marker, THE Map SHALL open the Event_Detail_Panel for that Map_Event.
4. THE Event_Detail_Panel SHALL display the Map_Event's title, description, timestamp, and Severity_Level.
5. WHEN the user clicks outside an open Event_Detail_Panel or dismisses it, THE Map SHALL close the Event_Detail_Panel and deselect the Event_Marker.
6. THE Map SHALL animate the transition when centering on a selected Event_Marker.

---

### Requirement 10: Map Dataset

**User Story:** As a developer, I want the map to load from a structured data source, so that the app can display real events and be extended to use a live API later.

#### Acceptance Criteria

1. THE Map_Dataset SHALL be loaded from a static mock JSON file containing an array of Map_Event records.
2. EACH Map_Event record in the Map_Dataset SHALL contain the fields: id, title, description, latitude, longitude, timestamp, and severity.
3. THE Map_Dataset schema SHALL be defined such that it can be replaced by a real-time API response without changes to the Map rendering logic.
4. IF the Map_Dataset fails to load, THEN THE Map SHALL display a non-blocking error message and render the Map without markers.

---

### Requirement 11: Deep Linking

**User Story:** As a user, I want to share a link to a specific event on the map, so that others can open the app and immediately see the same event I am viewing.

#### Acceptance Criteria

1. WHEN the user selects a Map_Event, THE App SHALL encode the Map_Event's id in the URL (via hash or query parameter) without triggering a full page reload.
2. WHEN the App is loaded with a Deep_Link URL containing a valid Map_Event id, THE Map SHALL center on that Map_Event's coordinates and open its Event_Detail_Panel automatically.
3. WHEN the App is loaded with a Deep_Link URL containing an id that does not match any Map_Event, THE Map SHALL load normally without selecting any event and display a non-blocking message indicating the event was not found.
4. WHEN the user dismisses the Event_Detail_Panel, THE App SHALL remove the event id from the URL.
5. FOR ALL valid Map_Event ids, encoding the id in the URL and then loading that URL SHALL result in the same Map_Event being selected (round-trip property).

---

### Requirement 12: Map and Feed Integration

**User Story:** As a user, I want Feed_Items that have geographic data to appear on the map, so that I can see where news events are happening.

#### Acceptance Criteria

1. WHEN a Feed_Item contains valid latitude and longitude fields, THE Map SHALL display an Event_Marker for that Feed_Item.
2. WHEN the user clicks a Feed_Item's Event_Marker, THE Event_Detail_Panel SHALL display the Feed_Item's simplified title and Simplified_Output at the active Reading_Level.
3. WHEN a new Polling_Cycle completes and new Feed_Items with coordinates are added, THE Map SHALL add the corresponding Event_Markers without removing existing markers.
4. WHEN the user selects a Reading_Level, THE Event_Detail_Panel SHALL update to display the Simplified_Output at the newly selected Reading_Level for any open Feed_Item event.

---

### Requirement 13: Map Performance

**User Story:** As a user, I want the map to remain responsive even when many events are displayed, so that I can interact with it without lag.

#### Acceptance Criteria

1. THE Map SHALL render up to 500 Event_Markers without degrading pan or zoom interaction below 30 frames per second.
2. WHEN the Map_Dataset contains more than 100 Event_Markers in a visible region, THE Map SHALL cluster nearby markers into a single cluster indicator showing the count.
3. WHEN the user zooms in on a cluster, THE Map SHALL expand the cluster to reveal individual Event_Markers.
4. THE Map SHALL load and display initial Event_Markers within 3 seconds of the page load completing under a standard broadband connection.

---

### Requirement 14: Map Accessibility

**User Story:** As a user with a disability, I want the map and its events to be accessible, so that I can use the situational awareness features regardless of my abilities.

#### Acceptance Criteria

1. THE Map SHALL provide a keyboard-accessible list view of all Map_Events as an alternative to the visual map.
2. WHEN the user navigates to an Event_Marker using keyboard controls, THE Map SHALL display a visible focus indicator on that marker.
3. THE Event_Detail_Panel SHALL be fully operable using keyboard navigation alone.
4. THE Event_Detail_Panel SHALL include an ARIA label identifying it as an event detail region.
5. WHEN the Event_Detail_Panel opens, THE App SHALL move keyboard focus to the panel and announce the Map_Event title via an ARIA live region.

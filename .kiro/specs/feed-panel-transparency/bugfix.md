# Bugfix Requirements Document

## Introduction

The live crisis feed panel (FeedPanelWrapper) lacks the transparency behavior that exists in the crisis text simplifier panel (SimplifierPanel). Currently, the feed panel remains fully opaque at all times, creating an inconsistent user experience. The feed panel should become slightly transparent when not being directly interacted with, matching the behavior of the simplifier panel for visual consistency and improved map visibility.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the feed panel is maximized and the user is not hovering over it THEN the system maintains full opacity (opacity-100)

1.2 WHEN the feed panel is maximized and the user is not focusing any element within it THEN the system maintains full opacity (opacity-100)

1.3 WHEN the feed panel is maximized and has no mouse or keyboard interaction THEN the system does not apply any transparency effect

### Expected Behavior (Correct)

2.1 WHEN the feed panel is maximized and the user is not hovering over it THEN the system SHALL apply reduced opacity (opacity-40)

2.2 WHEN the feed panel is maximized and the user is not focusing any element within it THEN the system SHALL apply reduced opacity (opacity-40)

2.3 WHEN the feed panel is maximized and the user hovers over it THEN the system SHALL restore full opacity (opacity-100)

2.4 WHEN the feed panel is maximized and the user focuses any element within it THEN the system SHALL restore full opacity (opacity-100)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the feed panel is minimized THEN the system SHALL CONTINUE TO maintain full opacity (opacity-100)

3.2 WHEN the feed panel is toggled between minimized and maximized states THEN the system SHALL CONTINUE TO animate the transition smoothly

3.3 WHEN the feed panel is maximized THEN the system SHALL CONTINUE TO display all feed content correctly

3.4 WHEN the user interacts with feed items THEN the system SHALL CONTINUE TO handle clicks and keyboard navigation correctly

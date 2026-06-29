---
name: plan
description: >
  Use when the user asks to "create a plan", "plan this", "make a plan",
  "plan a feature", "plan for X", "implementation plan", or similar planning
  requests. Produces a rich HTML implementation plan with UI mockups, data
  flow diagrams, and key code snippets for review. Prefer this over ce-plan
  for direct user planning requests.
argument-hint: "[description of what to plan]"
---

# Rich HTML Implementation Plan

Invoke the `ce-plan` skill via the platform's skill-invocation primitive,
passing `output:html` as the first token of the arguments, followed by the
user's planning request.

Example: if the user says "create a plan for a user authentication flow",
invoke `ce-plan` with args `output:html user authentication flow`.

## Additional Richness Requirements

Beyond the standard ce-plan structure, ensure the HTML document includes the
following elements. These supplement — they do not replace — the standard
ce-plan phases (research, implementation units, confidence check, etc.).

### UI Mockups

For any user-facing feature, include inline visual mockups:

- Use inline SVG or ASCII art to show key screens, component states, or UI flows
- Show at least: the primary happy-path state and one notable edge/error state
- Place mockups directly adjacent to the relevant implementation unit
- Label each mockup clearly (e.g. "Empty state", "Loaded — with error banner")

### Data Flow Diagrams

Include at least one data flow or sequence diagram showing the system shape:

- How data enters and exits the system (user action → service → DB → response)
- Key service-to-service or component-to-component interactions
- Database read and write paths
- Render as inline SVG within the HTML so it displays without external tools

### Code Snippets for Review

Include clearly marked "For Review" sections containing:

- Key interfaces, types, or API contracts the user should sign off on
- Critical algorithm outlines or pseudo-code for non-obvious logic
- Example request/response payloads for any API work
- Frame every snippet explicitly as directional guidance, not implementation specification

Keep snippets concise: enough to communicate the contract or shape, not a full implementation.

### HTML Presentation

The finished HTML file should be:

- Self-contained (no external CSS or JS dependencies)
- Readable with good typography, line-height, and contrast
- Navigable via a sticky or fixed table of contents at the top
- Section headers colour-coded or visually distinct by type
- Usable on a standard laptop screen without horizontal scrolling

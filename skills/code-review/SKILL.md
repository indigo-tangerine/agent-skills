---
name: code-review
description: >
  Use when the user asks to "review code", "do a code review", "review this PR",
  "review my changes", "check this branch", or similar code review requests.
  Produces a rich HTML code review report with a severity dashboard, finding cards,
  inline diff excerpts, and a sticky navigation TOC. Prefer this over ce-code-review
  for direct user review requests.
argument-hint: "[mode:agent] [blank to review current branch, or provide PR link]"
---

# Rich HTML Code Review Report

Invoke the `ce-code-review` skill via the platform's skill-invocation primitive,
passing all user-supplied arguments through unmodified.

After the review pipeline completes (all stages, including Stage 5c apply and Stage 6
synthesis), render the final report as a rich, self-contained HTML document instead of
the default markdown tables. Save it alongside the standard run artifacts under
`/tmp/compound-engineering/ce-code-review/<run-id>/report.html`.

## Additional Richness Requirements

These requirements supplement — they do not replace — the standard `ce-code-review`
Stage 6 structure (Applied section, per-severity finding tables, Actionable Findings
summary, Coverage, Verdict, etc.). All sections, stable finding numbers, and keyed
detail lines from the standard report must be present in the HTML output.

### Severity Dashboard

At the very top of the report, before the findings, include a compact dashboard:

- A colour-coded badge row showing the total finding count per severity level
  (P0, P1, P2, P3) using these colours: P0 = red (`#dc2626`), P1 = orange
  (`#ea580c`), P2 = amber (`#d97706`), P3 = slate (`#64748b`)
- A prominent verdict banner below the badges:
  - "Ready to merge" — green background
  - "Ready with fixes" — amber background
  - "Not ready" — red background
- Reviewer team listed as small tags below the verdict

### Finding Cards

Render each finding as a card with:

- A coloured left border (4 px solid) matching the severity colour above
- File path and line number as a monospace `<code>` span
- Issue title in bold; keyed detail text (`why_it_matters`, fix direction) inside a
  `<details>`/`<summary>` element defaulting to closed on P2/P3, open on P0/P1
- Reviewer name(s) and confidence anchor displayed as small metadata tags
- `suggested_fix` (when present) in a `<pre><code>` block with background shading

### Inline Diff Excerpts

For every P0 and P1 finding, include a diff hunk beneath the card:

- 3-5 lines of context around the cited line
- The cited line(s) highlighted with a yellow-tinted background row
- Lines prefixed `+` / `-` where applicable; neutral lines prefixed with a space
- Rendered inside a `<pre>` block using a monospace font

### Navigation

- A sticky table of contents at the top of the `<body>` linking to:
  - Severity sections (P0, P1, P2, P3) — omit empty sections
  - Applied, Actionable Findings, Coverage, Verdict
- A "Back to top" anchor at the end of each major section

### HTML Presentation

The finished HTML file must be:

- Self-contained (no external CSS or JS dependencies — all styles inline or in a
  `<style>` block in `<head>`)
- Readable with comfortable typography: `font-family: system-ui, sans-serif`,
  `line-height: 1.6`, `max-width: 900px`, centred
- Section headers colour-coded or visually distinct by severity level
- Usable on a standard laptop screen without horizontal scrolling
- The `<title>` set to `Code Review — <branch-or-PR> — <verdict>`

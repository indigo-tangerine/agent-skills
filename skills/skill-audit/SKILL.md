---
name: skill-audit
description: Audits recent Claude Code sessions for personal skill opportunities. Recommends new or updated skills based on evidence of repeated workflows, corrections, or friction. Personal skills only — never edits repo-level .claude/ files.
---

# Skill Audit

Audits recent Claude Code sessions for personal skill opportunities. Recommends new or updated skills based on evidence of repeated workflows, corrections, or friction. Does not touch repo skills unless explicitly asked.

**Scope**: personal skills only (`~/.claude/skills/`). Never suggest or edit repo-level `.claude/` files.

## Workflow

### 1. Discover recent sessions

Find session JSONL files modified in the last 7 days (default; accept override like "last 14 days"):

```bash
find ~/.claude/projects -name "*.jsonl" -mtime -7 | xargs ls -lt | head -30
```

Exclude subagent files (paths containing `/subagents/`).

### 2. Read installed personal skills

```bash
ls ~/.claude/skills/
```

Note names — these are the skills to compare against. Do not suggest duplicates.

### 3. Extract user prompts via a fork agent

Launch a fork agent (not inline) to read the session files and extract human-turn messages. The fork should:
- Parse each JSONL, collect `content` from messages where `role == "human"` (skip tool results)
- For files over 500 KB, sample the first 300 KB
- Identify: repeated multi-step workflows, corrections the user had to make more than once, and tasks where the user re-explained context they'd explained before

The fork reports candidates back as a structured list. Keep transcript noise out of the main context.

### 4. Evaluate candidates

For each candidate pattern, apply this filter before proposing anything:

- **Evidence bar**: at least 2 clear examples from sessions, OR 1 example with notable follow-up correction indicating the first attempt lacked guidance
- **Not already covered**: cross-check name and trigger against installed skills; if overlap exists, note it and skip
- **Narrow enough**: the pattern must be a specific, repeatable workflow — not general advice or a one-off
- **Personal scope**: if the pattern is repo-specific (tied to one project's conventions), do not suggest a personal skill

**Default is no change.** Only propose if evidence is clear.

### 5. Show proposals before touching files

For each proposed new or updated skill, display:
- Skill name and trigger description
- Evidence: 1–2 quoted user prompts showing the pattern
- Why existing skills don't cover it
- Full proposed `SKILL.md` content

Then ask: "Create these skills?" Do not write files until confirmed.

### 6. Execute and report

After confirmation, for each skill:
- **New**: `mkdir -p ~/.claude/skills/<name>` then write `SKILL.md`
- **Update**: read existing `SKILL.md`, apply changes, show diff before writing

End with a summary table:

| Skill | Action | Reason |
|-------|--------|--------|
| `example-skill` | Created | Evidence: 3 matching prompts |
| `other-skill` | Skipped | Already covered by `terraform-skill` |
| `candidate` | Rejected | Single occurrence, insufficient evidence |

## Constraints

- Never edit repo `.claude/` files or project-level skills
- Never delete existing skills — only propose additions or updates
- Never infer from a single prompt unless it contains a clear correction loop
- If no candidates pass the evidence bar, report "No changes recommended" with a brief explanation

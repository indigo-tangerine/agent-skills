# CLAUDE.md

Global preferences and guidelines for all projects.

## Working Directory

- Always confirm the current working directory before performing file operations or git commands
- When working across multiple repos, use absolute paths — `cd` to sibling directories does not persist between tool calls
- Never assume which repo you're in; run `pwd` first

## Git Conventions

- Branch naming follows ticket ID pattern: `<ticket-id>-short-description` (e.g., `PLT-1822-terraform-refactor`)
- Use conventional commits for all commit messages
- When creating branches, always fetch/pull main first

## Terraform

- Variable validation blocks cannot reference other variables (Terraform < 1.9 limitation)
- Always ask for the full file path before searching for Terraform files
- When editing tfvars files in bulk, confirm the target directory and file list first
- When fixing Terraform modules, align the fix approach with how other similar modules handle the same pattern rather than inventing a new approach.

### Inconsistent conditional result types

Terraform's `?:` operator requires both branches to have the same structural type at parse time. A common trigger is a `list(any)` variable vs a tuple literal local — they are incompatible even though they look similar.

**Fix:** use index-based selection instead of a ternary:

```hcl
result = [var.custom_value, local.default_value][var.custom_value != null ? 0 : 1]
```

This sidesteps the type-consistency check entirely. Pair with:
- `type = any` on the variable (not `list(any)`) to avoid further type enforcement
- A null-check condition (`!= null`) rather than `length() > 0`, since the default should be `null` not `[]`

## Git Hosting

- Use `glab` for GitLab repos (MRs, pipelines, issues) — not `gh`
- Use `gh` only for GitHub repos
- Detect which to use by checking the `origin` remote URL

### Creating merge requests

Always invoke the `/mr` skill when creating a GitLab MR — never call `glab mr create` directly. The skill runs a risk assessment and embeds it in the MR description. Using `glab` directly skips that step.

## General Guidelines

### Code Reviews

- When the user asks for a review (of code, a PR, a file, etc.), always delegate to a subagent using the Agent tool — never perform the review inline

### Knowledge Questions

- When the user asks a general knowledge or AWS question, answer directly from knowledge — do NOT search the codebase unless the question is clearly about this project's code

## Claude Code Hooks

### SessionStart output visibility

- Hook **stdout is never shown to the user** — it is captured as context for Claude (injected as a `<system-reminder>`), not displayed in the terminal or UI.
- `"blocking": true` only controls timing (Claude waits before starting the session); it does **not** make stdout visible to the user.
- To surface information to the user from a SessionStart hook, emit a JSON `additionalContext` block as the last line of stdout:
  ```json
  {
    "hookSpecificOutput": {
      "hookEventName": "SessionStart",
      "additionalContext": "..."
    }
  }
  ```
  Claude reads the `additionalContext` string from the `<system-reminder>` injected at session start and presents it to the user in its opening message.
- To inspect the raw value, ask Claude: _"What did the SessionStart hook report?"_ — Claude will quote or paraphrase it from its system context.
- **stderr** is only shown to the user on non-zero exit (as a hook error notice). Do not add ANSI codes or spinners to hook stdout — they are invisible to users and pollute the context injected into Claude.

@RTK.md

## GitLab

### Git

- When using `glab` CLI commands, always use explicit flags (e.g., `--yes`, `--no-interactive`, `-F` for body) to avoid interactive TUI that doesn't work in this terminal context.

### CI/CD

- For GitLab CI YAML files: Always include `---` document separator, validate YAML syntax before committing, and test variable interpolation in the correct context (some locations don't support `!reference` or input interpolation).

## Git Workflow

- For git commits, always confirm the target branch before committing. Never commit directly to main - use feature branches and MRs.

## AWS/Authentication

- When AWS SSO credentials expire, the session-start hook should handle refresh. If credentials are still expired, user may need to restart the Claude session for environment variables to update.

## PLG Agent Skills

- When writing or modifying skills, always read `/Users/rupert.broad/code/plg-tech/plg/knowledge/plg-agent-skills/CONTRIBUTING.md` and `/Users/rupert.broad/code/plg-tech/plg/knowledge/plg-agent-skills/README.md` before starting.

## Project CLAUDE.md (`/init` and setup)

When running `/init` or creating a CLAUDE.md for any project:

1. Scan the repo for a documentation folder (`docs/`, `documentation/`, `doc/`, or similar).
2. If one exists, include a **Documentation Index** section in CLAUDE.md listing each file with a one-line description inferred from the file name or first heading. Use a compact format:
   ```markdown
   ## Documentation (`docs/`)
   - `docs/architecture.md` — System architecture overview
   - `docs/api.md` — API reference and endpoint catalogue
   ```
3. Keep CLAUDE.md itself lightweight — reference doc files by path, never inline their content. The index is the pointer, not the document.
4. If no docs folder exists yet, add a placeholder comment: `<!-- No docs/ folder found; add one and re-run /init to populate this index. -->`

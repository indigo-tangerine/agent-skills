# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo does

Personal Claude Code skills, global config files, and a plugin reinstall guide — designed to be cloned on a new machine and set up via `setup.sh`.

## Common commands

```bash
# Structural validation (frontmatter, SKILL.md presence, evals.json presence)
npm run validate

# LLM behavioral evals against GitHub Models API (requires GITHUB_TOKEN)
GITHUB_TOKEN=<token> npm run evals

# Run evals for a single skill
GITHUB_TOKEN=<token> npm run evals -- mr

# Shell-based content validation (frontmatter in all markdown, shellcheck on hooks/, broken symlinks)
./scripts/validate-content.sh
```

## Architecture

### Three validation layers

There are three independent validators — each covers different concerns:

| Script | Invoked by | What it checks |
|--------|-----------|----------------|
| `scripts/validate-content.sh` | `ci.yml` | Frontmatter in `skills/**/*.md` and `plugins/**/*.md`; shellcheck on `hooks/*.sh`; broken symlinks; no empty files. Requires `skills/`, `plugins/`, and `hooks/` directories to exist. |
| `scripts/validate-skills.js` | `validate.yml` | Each `skills/` subdirectory has a `SKILL.md`; frontmatter `name` matches the directory name; `description` ≤ 1024 chars; `evals.json` present. |
| `scripts/run-evals.js` | `evals.yml` | Loads each skill's `SKILL.md` as the system prompt, sends test prompts to GitHub Models (`gpt-4o-mini`), checks responses against keyword assertions. |

### Skill structure

Each skill lives under `skills/<name>/` and requires two files:

- **`SKILL.md`** — YAML frontmatter with `name` (must match directory name) and `description`, followed by the skill instructions
- **`evals.json`** — behavioral test scenarios:
  ```json
  {
    "scenarios": [
      {
        "name": "human-readable scenario name",
        "prompt": "user prompt sent to the model",
        "must_contain": ["keyword1"],
        "must_not_contain": ["forbidden"]
      }
    ]
  }
  ```

### Eval keyword strategy

Evals use keyword matching (`must_contain` / `must_not_contain`) against the model's response. Write keywords against *intent and output concepts*, not exact CLI syntax or platform-specific skill names (e.g. `ce-code-review`, `ce-plan`). The eval model is `gpt-4o-mini` via GitHub Models and does not understand Claude Code's skill invocation mechanism.

### CI/CD workflows

- **`ci.yml`** — runs `validate-content.sh` on every PR and push to main
- **`validate.yml`** — runs `validate-skills.js` on every PR and push to main
- **`evals.yml`** — runs LLM evals on PRs that touch `SKILL.md` or `evals.json`; requires `permissions: models: read` for `GITHUB_TOKEN` to reach the GitHub Models API
- **`release.yml`** — semantic-release on merge to main (conventional commits drive version bumps)

### global/ and setup

`global/` contains `CLAUDE.md`, `RTK.md`, and `settings.json` (a template with `MACHINE_SPECIFIC_PATH` and `YOUR_TAVILY_API_KEY` placeholders). `setup.sh` copies skills and global config to `~/.claude/` on a new machine, skipping files that already exist.

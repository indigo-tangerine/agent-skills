# agent-skills

Personal Claude Code skills, global config, and plugin reinstall guide.

## What's here

```
skills/           Personal skills — copied to ~/.claude/skills/ on each machine
  branch/         Create a feature branch from a ticket ID
  code-review/    Rich HTML code review report (wraps ce-code-review)
  commit-mr/      Commit + push + open a GitLab MR (Terraform-aware)
  mr/             Full GitLab MR flow with risk assessment
  plan/           Rich HTML implementation plan (wraps ce-plan)
  skill-audit/    Audit sessions and recommend new personal skills
  terraform-module-test/   Generate terraform test suites for modules
  terraform-moved-blocks/  Generate moved blocks from a Terraform plan

global/           Config files copied to ~/.claude/ on each machine
  CLAUDE.md       Global Claude Code instructions
  RTK.md          RTK (Rust Token Killer) usage reference
  settings.json   Settings template — update paths and secrets before use

plugins.md        Plugin reinstall commands for each installed plugin
setup.sh          Setup script to install skills and global config
```

## New machine setup

```bash
git clone https://github.com/indigo-tangerine/agent-skills.git
cd agent-skills
chmod +x setup.sh
./setup.sh
```

Then follow the `settings.json` and plugin instructions printed by the script.

### settings.json

`global/settings.json` has two types of machine-specific values:

1. **`MACHINE_SPECIFIC_PATH`** — replace with your actual local paths in `extraKnownMarketplaces`
2. **`YOUR_TAVILY_API_KEY`** — replace with your Tavily API key from [tavily.com](https://tavily.com)

### Plugins

See [plugins.md](plugins.md) for `claude plugin install` commands grouped by source.

## CI/CD

Two workflows run on pull requests:

| Workflow | Trigger | What it checks |
|----------|---------|----------------|
| `validate.yml` | Every PR | SKILL.md exists, frontmatter `name`/`description` valid, evals.json present, markdown linting |
| `evals.yml` | Changes to `SKILL.md` or `evals.json` | Runs per-skill behavioral scenarios via GitHub Models (gpt-4o-mini) — no secrets required |

Run locally:

```bash
npm install
npm run validate                            # structural checks
GITHUB_TOKEN=<token> npm run evals          # all skills
GITHUB_TOKEN=<token> npm run evals -- mr    # single skill
```

Each skill has an `evals.json` defining prompt scenarios with `must_contain` and `must_not_contain` keyword assertions.

## Keeping in sync

After adding or updating a skill on one machine, commit and push:

```bash
cp ~/.claude/skills/<name>/SKILL.md skills/<name>/SKILL.md
git add skills/<name>/SKILL.md
git commit -m "chore: update <name> skill"
git push
```

Then pull and re-run `./setup.sh` on the other machine (or copy the file directly).

# Plugin Reinstall Guide

Install these plugins after setting up a new machine. Run `claude plugin install` commands from any directory.

## Official plugins (no marketplace setup needed)

```bash
claude plugin install skill-creator@claude-plugins-official
claude plugin install code-review@claude-plugins-official
claude plugin install claude-md-management@claude-plugins-official
claude plugin install github@claude-plugins-official
```

## GitHub-sourced plugins

```bash
# Compound Engineering (EveryInc)
claude plugin install compound-engineering@compound-engineering-plugin

# Terraform skill (antonbabenko)
claude plugin install terraform-skill@antonbabenko
```

## Marketplace setup required first

These plugins need their marketplace registered before installing.

### addy-agent-skills

Clone the marketplace repo, then register and install:

```bash
# Register marketplace pointing to your local clone
claude plugin marketplace add addy-agent-skills --source directory --path /path/to/agent-skills/agent-skills

# Install
claude plugin install agent-skills@addy-agent-skills
```

### gitkraken

```bash
# Register marketplace (gitkraken marketplace is bundled under ~/.claude/plugins/marketplaces/gitkraken after first install)
# On the source machine: ls ~/.claude/plugins/marketplaces/gitkraken
# Copy that directory to the new machine, then:
claude plugin marketplace add gitkraken --source directory --path ~/.claude/plugins/marketplaces/gitkraken

claude plugin install gitkraken-hooks@gitkraken
```

### python-development (local)

```bash
# Register local plugin source
claude plugin marketplace add local --source directory --path /path/to/python-development

claude plugin install python-development@local
```

### plg (internal — requires PLG repo access)

```bash
# Register using the PLG monorepo path
claude plugin marketplace add plg --source directory --path /path/to/plg-tech/plg/knowledge/plg-agent-skills

claude plugin install plg-core@plg
claude plugin install plg-infra@plg
claude plugin install plg-ops@plg
claude plugin install plg-tools@plg
```

## Notes

- `MACHINE_SPECIFIC_PATH` in `settings.json` must be updated with actual paths on each machine
- Set your Tavily API key: replace `YOUR_TAVILY_API_KEY` in `global/settings.json` before copying to `~/.claude/settings.json`

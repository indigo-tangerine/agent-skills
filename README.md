# agent-skills

Repository for hosting agent skills, plugins, and hooks.

## Layout

- `skills/`: skill definitions and docs (markdown files with front-matter)
- `plugins/`: plugin definitions and docs (markdown files with front-matter)
- `hooks/`: shell hook scripts
- `scripts/validate-content.sh`: local/CI validation entrypoint

## CI/CD

- CI (`.github/workflows/ci.yml`) validates:
  - front-matter in skills/plugins markdown
  - shell scripts with `shellcheck`
  - broken symlinks
  - empty files under skills/plugins/hooks
- Release (`.github/workflows/release.yml`) runs semantic-release on successful merge to `main`.

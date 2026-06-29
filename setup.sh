#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"

echo "Agent Skills Setup"
echo "=================="
echo "Source: $REPO_DIR"
echo "Target: $CLAUDE_DIR"
echo ""

# Skills
echo "Installing personal skills..."
mkdir -p "$CLAUDE_DIR/skills"
for skill_dir in "$REPO_DIR/skills"/*/; do
  skill_name="$(basename "$skill_dir")"
  target="$CLAUDE_DIR/skills/$skill_name"
  if [[ -d "$target" ]]; then
    echo "  [skip] $skill_name already exists — remove $target to reinstall"
  else
    cp -r "$skill_dir" "$target"
    echo "  [ok]   $skill_name"
  fi
done

echo ""

# Global config files
echo "Installing global config files..."

copy_global() {
  local src="$REPO_DIR/global/$1"
  local dst="$CLAUDE_DIR/$1"
  if [[ -f "$dst" ]]; then
    echo "  [skip] $1 already exists — remove $dst to reinstall"
  else
    cp "$src" "$dst"
    echo "  [ok]   $1"
  fi
}

copy_global "CLAUDE.md"
copy_global "RTK.md"

echo ""

# settings.json — always manual to avoid overwriting
echo "settings.json — manual step required:"
echo "  Review global/settings.json, update MACHINE_SPECIFIC_PATH entries and"
echo "  YOUR_TAVILY_API_KEY, then copy to ~/.claude/settings.json"
echo "  Or merge individual sections into an existing settings.json."

echo ""
echo "Done. See plugins.md for plugin reinstall commands."

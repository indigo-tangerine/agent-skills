#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

required_dirs=(skills plugins hooks)
for dir in "${required_dirs[@]}"; do
  if [[ ! -d "$dir" ]]; then
    echo "Missing required directory: $dir" >&2
    exit 1
  fi
done

check_front_matter() {
  local file="$1"
  local first
  first="$(head -n 1 "$file" || true)"
  if [[ "$first" != "---" ]]; then
    echo "Missing front-matter start in $file" >&2
    return 1
  fi
  awk 'NR>1 && /^---$/ { found=1; exit } END { exit(found?0:1) }' "$file" || {
    echo "Missing front-matter end in $file" >&2
    return 1
  }
}

while IFS= read -r -d '' md; do
  check_front_matter "$md"
done < <(find skills plugins -type f -name '*.md' -print0)

broken_links="$(find . -xtype l -print)"
if [[ -n "$broken_links" ]]; then
  echo "Found broken symlinks:" >&2
  echo "$broken_links" >&2
  exit 1
fi

if ! command -v shellcheck >/dev/null 2>&1; then
  echo "shellcheck is required but not installed" >&2
  exit 1
fi

while IFS= read -r -d '' script; do
  shellcheck "$script"
done < <(find hooks -type f -name '*.sh' -print0)

while IFS= read -r -d '' file; do
  if [[ ! -s "$file" ]]; then
    echo "Empty file is not allowed: $file" >&2
    exit 1
  fi
done < <(find skills plugins hooks -type f -print0)

echo "Repository skill/plugin/hook validation passed"

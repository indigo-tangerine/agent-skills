---
name: mr
description: Create or update a GitLab MR. Stages, commits, pushes, and opens a GitLab MR targeting main. Includes a risk assessment of the change in the MR description, with particular focus on direct and indirect dependencies affected by the changes.
---

# Create Merge Request with Risk Assessment

Full flow: stage, commit, push, open a GitLab MR, and embed a risk assessment in
the MR description.

## Step 1 — Confirm context

```bash
pwd
git branch --show-current
git status
```

Confirm you are not on `main`. If you are, stop and ask the user to create a
feature branch first.

## Step 2 — Stage and commit

Stage relevant files — prefer specific paths over `git add .`.

Ask for a commit message if not provided. Follow conventional commit style
(`feat:`, `fix:`, `chore:`, etc.).

## Step 3 — Push

```bash
git push -u origin <branch>
```

## Step 4 — Risk Assessment (run before creating the MR)

Gather the diff against the target branch:

```bash
git diff origin/main..HEAD --stat
git diff origin/main..HEAD
```

Work through the assessment in three stages. Keep the analysis concise — the
goal is a useful summary in the MR, not an exhaustive audit.

### 4a. Classify the changed files

Group changed files by type and note the change volume:

| Type | Examples |
|------|---------|
| Application logic | `.ts`, `.py`, `.go`, `.rb`, `.java`, `.kt` |
| Configuration | `.env`, `.yaml`, `.json`, `.toml`, `.ini` |
| Database migration | `migrations/`, `*_migration.*`, `*.sql`, `schema.rb` |
| API definition | `openapi.yaml`, `*.graphql`, `*.proto` |
| CI/CD pipeline | `.gitlab-ci.yml`, `.github/workflows/`, `Dockerfile` |
| Infrastructure | `*.tf`, `*.tfvars`, CloudFormation templates |
| Tests only | `*_test.*`, `*_spec.*`, `__tests__/` |
| Documentation | `*.md`, `*.rst` |

### 4b. Direct dependencies

Scan import/require/use statements in each changed file to identify:
- External packages or libraries being added, removed, or version-changed
- Internal modules, services, or utilities that the changed code calls into

### 4c. Reverse dependencies (indirect impact)

For each changed source file, find what else in the codebase imports it:

```bash
# adjust pattern to match the language (import, require, use, include, from)
git ls-files | xargs grep -l "<changed-module-or-filename>" 2>/dev/null | grep -v "^<changed-file-itself>$"
```

Run this for each meaningfully changed file. Collect the list of callers —
these are the indirect dependencies most likely to break.

### 4d. Interface and contract changes

Look for:
- Changed function/method signatures or return types
- Added, removed, or renamed exported symbols
- Changed API endpoint paths, verbs, or request/response shapes
- Changed database schema (column renames, type changes, nullable changes,
  dropped columns, new NOT NULL columns without defaults)
- Changed environment variable names or added required env vars
- Changed event structures or message schemas

### 4e. Risk signals — elevate the risk level when any of these are present

| Signal | Elevate to |
|--------|-----------|
| Auth, authorisation, or session logic changes | HIGH |
| Database migrations touching existing data | HIGH |
| Removal or renaming of an exported symbol with callers | HIGH |
| Shared utility or base class used across many files | HIGH |
| CI/CD pipeline changes | MEDIUM |
| Dependency major version bump | MEDIUM |
| Config changes affecting multiple environments | MEDIUM |
| New dependency with no existing callers | LOW |
| Test-only changes | LOW |
| Documentation-only changes | LOW |

### 4f. Overall risk level

| Level | Criteria |
|-------|---------|
| **LOW** | No callers affected, no interface changes, isolated new code or tests |
| **MEDIUM** | Changes to existing logic, config, or dependencies with bounded callers |
| **HIGH** | API/interface changes with callers, auth logic, migrations, widely-used utilities |
| **CRITICAL** | Breaking changes to widely-used interfaces; data migrations on live data; security/auth removals |

## Step 5 — Build the MR description

Construct the full description as a string and pass it via `--description`.
Do not use `--fill` as it does not include the risk section.

```
## Summary

<what this MR does and why — 2-4 sentences>

## Changes

<brief bullet list of what changed>

---

## Risk Assessment

**Risk level:** LOW / MEDIUM / HIGH / CRITICAL

### Dependencies affected

**Direct dependencies** _(things the changed code calls into)_
- <package or internal module — note if version changed or if usage pattern changed>
- None — if no external or internal dependencies changed

**Reverse dependencies** _(things that import or call the changed files)_
- `path/to/caller.ts` — <one-line note on how it is affected>
- None found — if grep returned nothing

**Interface changes**
- <changed signatures, removed exports, API shape changes, schema changes>
- None — if no public interface changed

### Risk factors

- <specific factor, e.g. "Removes exported `formatDate` used in 8 files — callers will need updating">
- <or "New migration adds NOT NULL column `status` — requires backfill before deploy">
- <or "No callers found for the changed module">

### Verification checklist

- [ ] <specific test suite to run>
- [ ] <integration or smoke test to confirm no regressions in affected callers>
- [ ] <environment-specific check if config or env vars changed>
- [ ] <manual verification step if no automated coverage exists>

---

*Risk assessment is decision-support. A human reviewer should validate before merging.*
```

## Step 6 — Create the MR

```bash
glab mr create \
  --target-branch main \
  --title "<conventional-commit-style title>" \
  --description "<full description from Step 5>" \
  --yes \
  --remove-source-branch
```

If `glab` is unavailable, fall back to:

```bash
gh pr create --base main --title "<title>" --body "<description>"
```

## Step 7 — Confirm

Output the MR URL and confirm the target branch is `main`.

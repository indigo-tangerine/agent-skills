---
name: commit-mr
description: Commit current changes on a feature branch and open a GitLab MR
---
1. Verify current branch is not main; if it is, create a feature branch named after the change
2. Stage and commit with a conventional commit message derived from the diff
3. Push with -u origin <branch>
4. Create the MR:
   - Detect whether the diff contains Terraform files (`.tf`, `.tfvars`, `.tftest.hcl`)
   - **If Terraform changes are present**, write an explicit `--title` and `--description` instead of using `--fill`. The description must cover:
     - **What changed and why** for each logical group of changes (resource changes, variable renames/removals, locals moved between files, provider/version bumps, CI changes)
     - **Variable changes** — any added, renamed, removed, or type-changed variables, and what replaces them
     - **Test plan** — a markdown checklist including: `terraform test` result, `tflint` result, plan output reviewed per environment before applying, and any apply-specific risks (destroys, replacements, state moves)
     - Use the MR we just crafted for STS-1714 as the quality benchmark for this level of detail
   - **If no Terraform files**, use `glab mr create --fill --yes --remove-source-branch` as normal
   - Always add `--yes --remove-source-branch`
5. Print the MR URL and confirm target branch is correct

# Terraform Moved Blocks

Use when the user provides a Terraform plan (JSON file or text output) and wants to generate `moved` blocks to preserve state for resources that appear as destroys due to refactoring rather than true deletion.

## Workflow

1. Parse the plan — collect all resources with `actions: ["delete"]` or `actions: ["delete","create"]` (replace).
2. For each, examine the old and new addresses to classify:
   - **True delete**: resource genuinely removed — skip, do not write a `moved` block.
   - **Refactor**: address changed due to rename, module restructuring, or index change — write a `moved` block.
   - Common refactor signals: `this` → `this[0]`, no index → indexed, module path restructuring, resource rename.
3. Write `moved` blocks to `moved.tf` in the relevant module root:
   ```hcl
   moved {
     from = <old_address>
     to   = <new_address>
   }
   ```
4. Count coverage: report how many `delete` actions were in the plan vs how many `moved` blocks were written.
5. Flag any destroys that could not be matched and ask the user to confirm they are intentional.

## Constraints

- `moved` blocks cannot cross into submodules that do not exist in the current configuration.
- Index-only changes (`this` → `this[0]`) are valid `moved` blocks.
- Resources that change type cannot use `moved` — they require destroy/recreate.
- If the plan JSON path is not provided, ask for it before starting.

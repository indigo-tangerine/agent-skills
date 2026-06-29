---
name: terraform-module-test
description: Use when writing tests for Terraform modules using the native test framework (terraform test). Generates mock files, validation tests, integration tests, and advanced edge-case tests. Supports basic and advanced testing levels. Do NOT use for testing root infrastructure configurations or Terratest (Go) - this skill targets module unit/integration tests using HCL test files.
---

# Terraform Module Test Skill

Generates a complete `terraform test` suite for a Terraform **module**. Covers mock setup, variable validation tests, resource integration tests, and advanced edge cases. Based on the project's AGENT-GUIDE.md and terraform-skill best practices.

## When to Use This Skill

**Activate when:**

- Writing tests for a Terraform module (reusable component, not root infrastructure)
- Setting up `tests/` directory structure from scratch
- Adding validation or integration test coverage to an existing module
- User specifies a testing level: `basic` or `advanced`

**Do not use for:**

- Root infrastructure configurations (env-specific Terraform applying real state)
- Terratest / Go-based testing
- Testing compositions or infrastructure modules

---

## Step 1: Collect Inputs

Ask the user for (if not already provided):

1. **Module path** — absolute or relative path to the module directory (contains `variables.tf`, `main.tf`, `outputs.tf`)
2. **Testing level** — `basic` or `advanced` (default: `basic` if not specified)

If the module path is not provided, ask before proceeding.

---

## Step 2: Analyse the Module

Read these files from the module directory before writing any tests:

1. `variables.tf` — extract every variable: name, type, default, nullable, validation rules, and valid values
2. `main.tf` — identify resources and data sources created by the module
3. `outputs.tf` — identify outputs (name, whether they reference computed attributes)
4. `versions.tf` (if present) — confirm Terraform version supports native testing (>= 1.6) and mocking (>= 1.7)

Build a mental model:

- Which variables have validation blocks? → need `expect_failures` tests
- Which variables have defaults? → don't assume computed logic; test the actual default
- Which outputs reference computed attributes (IDs, ARNs, generated names)? → need `command = apply`
- Which data sources are used? → need `mock_data` entries
- Which resources are created? → need `mock_resource` entries for any that have computed attributes tested
- Does any `for_each` use keys derived from a computed attribute (e.g. `domain_validation_options`)? → this is a structural problem; neither `mock_resource` defaults nor `override_resource` can make those keys known at plan time — the module code itself must be fixed to key `for_each` from input variables instead (see Error Reference)

---

## Step 3: Pre-flight Checks

Before generating tests:

```bash
# From the module directory:
tflint --recursive          # Fix any existing lint issues first
terraform init              # Ensure providers are initialised
```

If `tflint` reports unused variables, data sources, or resources — remove them from the module **before** writing tests. Tests for unused code will fail.

---

## Step 4: Create the Test File Structure

### Basic Level

```text
<module>/
└── tests/
    ├── mocks/
    │   └── all.tfmock.hcl          # Mock data sources and resources only
    └── validation.tftest.hcl       # Variable validation rules
    └── integration.tftest.hcl      # Core resource creation and outputs
```

### Advanced Level

```text
<module>/
└── tests/
    ├── mocks/
    │   └── all.tfmock.hcl          # Mock data sources and resources only
    ├── validation.tftest.hcl       # Variable validation rules
    ├── integration.tftest.hcl      # Core resource creation and outputs
    └── advanced.tftest.hcl         # Edge cases, overrides, boundary conditions
```

---

## Step 5: Generate `tests/mocks/all.tfmock.hcl`

This file contains **only** `mock_data` and `mock_resource` blocks.

### Critical Rules for Mock Files

| Rule | Detail |
|------|--------|
| NO `mock_provider` blocks | `mock_provider` belongs in `.tftest.hcl` files |
| NO `mock_module` blocks | Modules cannot be mocked directly |
| NO HCL functions in defaults | Use pre-encoded strings (e.g. pre-encoded JSON, not `jsonencode()`) |
| `mock_data` for data sources | One block per `data` source used in the module |
| `mock_resource` for resources | Only needed if the resource has computed attributes you'll assert on |
| Realistic values | Use valid ARN formats, realistic IDs — aids readability |

### Template

```hcl
# Mock data sources and resources for <module-name> tests

mock_data "aws_region" {
  defaults = {
    name = "eu-west-1"
    id   = "eu-west-1"
  }
}

# Add one mock_data block per data source in the module
# mock_data "<resource_type>" {
#   defaults = {
#     id  = "<realistic-id>"
#     arn = "arn:aws:<service>:<region>:<account>:<resource>"
#   }
# }

# Add mock_resource blocks only for resources with computed attributes you will assert on
# mock_resource "aws_<resource_type>" {
#   defaults = {
#     id  = "<mock-id>"
#     arn = "arn:aws:<service>:<region>:<account>:<resource>"
#   }
# }
```

---

## Step 6: Generate `tests/validation.tftest.hcl`

Tests every variable validation rule. Uses `command = plan` (fast, no resource creation).

### Header (required in every `.tftest.hcl`)

```hcl
# Variable validation tests for <module-name>

mock_provider "aws" {
  source = "./tests/mocks"
}

test { parallel = true }
```

### Pattern: Valid value (should succeed)

No `assert` needed for success — just supply a valid variable set and let plan pass.

```hcl
run "valid_<variable_name>" {
  command = plan

  variables {
    # Provide minimum valid set of required variables
    <var> = "<valid-value>"
  }
}
```

### Pattern: Invalid value (should fail)

```hcl
run "invalid_<variable_name>_<reason>" {
  command = plan

  variables {
    <var> = "<invalid-value>"
  }

  expect_failures = [
    var.<var>,
  ]
}
```

### Rules

- One `run` block per validation condition (both passing and failing cases)
- Group tests by variable
- Always use values that are **actually valid** per `variables.tf` — read the validation block first
- For variables with `default = null` and a conditional validation (`var.x != null ? ... : true`), test:
  - Omitting the variable (uses default, validation skipped)
  - Providing a valid value
  - Providing an invalid value

---

## Step 7: Generate `tests/integration.tftest.hcl`

Tests core module functionality: resources are created with correct attributes, outputs are populated.

### Header

```hcl
# Integration tests for <module-name>

mock_provider "aws" {
  source = "./tests/mocks"
}

test { parallel = true }
```

### command = plan vs command = apply decision

| What you're testing | Command |
|---------------------|---------|
| Input-derived attributes (set directly from a variable) | `plan` |
| Computed attributes (IDs, ARNs, generated names) | `apply` |
| Set-type blocks (cannot index with `[0]`) | `apply` |
| Module outputs | `apply` |
| Postconditions | `apply` |

### Pattern: Resource attribute from input (plan)

```hcl
run "resource_has_correct_name" {
  command = plan

  variables {
    name = "test-resource"
  }

  assert {
    condition     = <resource_type>.<name>.name == "test-resource"
    error_message = "Resource name should match input variable"
  }
}
```

### Pattern: Output test (apply required)

```hcl
run "outputs_are_populated" {
  command = apply

  variables {
    # Minimum required variables
  }

  assert {
    condition     = output.<output_name> != null
    error_message = "Output <output_name> should not be null"
  }
}
```

### Pattern: Set-type block (apply required)

```hcl
run "encryption_configured" {
  command = apply

  assert {
    condition = alltrue([
      for rule in <resource>.<name>.rule :
      alltrue([
        for config in rule.apply_server_side_encryption_by_default :
        config.sse_algorithm == "AES256"
      ])
    ])
    error_message = "Encryption should use AES256"
  }
}
```

---

## Step 8: Generate `tests/advanced.tftest.hcl` (Advanced Level Only)

Tests edge cases, boundary conditions, and data source override scenarios.

### Header

```hcl
# Advanced tests for <module-name>

mock_provider "aws" {
  source = "./tests/mocks"
}

test { parallel = true }
```

### What to include

- **Minimal configuration** — only required variables, all optional variables omitted
- **Maximum configuration** — all optional variables set
- **Boundary conditions** — minimum/maximum list lengths, string lengths, numeric ranges
- **All enum values** — test every valid value for enum-like variables (e.g. `environment = "prod"`, `environment = "staging"`)
- **Boolean flags** — test both `true` and `false` for feature-flag variables
- **Override data sources** — test behaviour changes when underlying data differs

### Pattern: Minimal configuration

```hcl
run "minimal_config" {
  command = plan

  variables {
    # Only required variables; all optional variables omitted to test defaults
    required_var = "value"
  }

  assert {
    condition     = <resource>.<name> != null
    error_message = "Module should deploy with minimal configuration"
  }
}
```

### Pattern: Data source override

```hcl
run "different_vpc_cidr" {
  command = plan

  override_data {
    target = data.aws_vpc.this
    values = {
      id         = "vpc-override"
      cidr_block = "172.31.0.0/16"
    }
  }

  variables {
    vpc_id = "vpc-override"
  }

  assert {
    condition     = <resource>.<name>.cidr_block == "172.31.0.0/16"
    error_message = "Module should use VPC CIDR from data source"
  }
}
```

### Pattern: Environment-specific behaviour

```hcl
run "prod_requires_multi_az" {
  command = plan

  variables {
    environment = "prod"
    multi_az    = false  # Violates prod requirement
  }

  expect_failures = [
    var.multi_az,
  ]
}

run "dev_single_az_allowed" {
  command = plan

  variables {
    environment = "dev"
    multi_az    = false  # OK for dev
  }
}
```

---

## Step 9: Run and Iterate

```bash
# From the module directory:
terraform init
terraform test

# If failures occur:
# 1. Read the error message carefully
# 2. Check if command = plan should be command = apply
# 3. Check if a variable value is actually valid per variables.tf
# 4. Check if a block is a set-type (requires for expression or apply mode)
# 5. Fix and re-run

# Final lint check
tflint --recursive
```

---

## Critical Rules

| Rule | Why |
|------|-----|
| `mock_provider` in `.tftest.hcl` only | Terraform rejects `mock_provider` in `.tfmock.hcl` |
| No `mock_module` blocks | Modules cannot be mocked — mock their constituent resources/data sources |
| No HCL functions in mock `defaults` | e.g. use `"{\"key\":\"value\"}"` not `jsonencode({...})` |
| `test { parallel = true }` in every test file | Enables parallel execution |
| All test variables use valid values from `variables.tf` | Avoid using values that fail validation |
| Defaults in `variables.tf` checked — tests reflect actual defaults | Don't assume computed logic |
| `command = apply` for outputs and computed attributes | Outputs and computed attributes are only available after apply |
| Set-type blocks accessed via `for` expressions or `apply` mode | Cannot index with `[0]` |
| `for_each` keys must come from input variables, not computed attributes | `mock_resource` defaults and `override_resource` cannot make computed attribute keys known at plan time — fix the module code itself |

---

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `Blocks of type 'mock_module' are not expected` | Used `mock_module` in mock file | Remove it; mock individual resources/data sources instead |
| `mock_provider not expected here` | `mock_provider` in `.tfmock.hcl` | Move to `.tftest.hcl` |
| `Cannot index a set value` | Used `[0]` on a set-type block | Use `for` expression or switch to `command = apply` |
| `Condition expression could not be evaluated` | Computed value tested with `command = plan` | Switch to `command = apply` |
| `for_each map includes keys derived from resource attributes that cannot be determined until apply` | `for_each` keys come from a computed attribute | Fix the module: key `for_each` from an input variable and build a local map from the computed attribute |
| `Unused variable / data source` | tflint warning | Remove unused declaration from module before writing tests |
| Test fails: unexpected attribute value | Variable has a default that differs from expected | Check `variables.tf` for `default =` |

---

## Quick Reference Checklist

Before finishing:

- [ ] `tflint --recursive` passes with 0 issues
- [ ] `mock_provider` is in `.tftest.hcl` files only
- [ ] `source = "./tests/mocks"` in every `mock_provider` block
- [ ] `test { parallel = true }` in every `.tftest.hcl` file
- [ ] No `mock_module` blocks anywhere
- [ ] All test variables use valid values from `variables.tf`
- [ ] Defaults in `variables.tf` checked — tests reflect actual defaults
- [ ] `command = apply` used for outputs and computed attributes
- [ ] Set-type blocks accessed via `for` expressions or `apply` mode
- [ ] All variable validation rules have both valid and invalid test cases
- [ ] `terraform test` passes with 0 failures
- [ ] Advanced level: edge cases, boundary conditions, and all enum values covered

---
name: branch
description: Create a feature branch from a ticket ID. Fetches and pulls main first, then creates a branch named <ticket-id>-<short-description>.
---

# Create Feature Branch

1. Run `pwd` to confirm correct repo
2. Run `git fetch origin && git checkout main && git pull origin main`
3. Ask user for ticket ID if not provided
4. Create branch: `git checkout -b <ticket-id>-<short-description>`
5. Confirm branch created with `git branch --show-current`

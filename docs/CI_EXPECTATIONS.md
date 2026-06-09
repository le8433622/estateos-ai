# EstateOS CI/CD Pipeline Expectations

## Documentation Compliance Notice

This document is governed by `docs/DOCUMENTATION_COMPLIANCE.md`. Any implementation, change, deployment, or completion claim touching this document must record the mandatory Documentation Compliance Checkpoint with `Decision: PASS`.

## Required Checks

Every PR or push to `main` must pass:

```txt
- backend lint: eslint passes
- backend build: tsc + babel succeeds
- frontend lint: eslint passes
- frontend build: vite build succeeds
- admin lint: eslint passes
- admin build: vite build succeeds
- root lint: eslint passes
- forbidden pattern check: no forbidden labels in source
- documentation compliance check: every .md has compliance notice and governance docs have hard gate
- backend compliance tests: estateosCompliance passes
```

## Workflow Files

- `build.yml` — runs lint + build for backend, admin, frontend, mobile
- `test.yml` — runs backend unit tests with coverage (requires MongoDB)
- `containerize.yml` — Docker image build
- `bump-version.yml` — automatic version bumping

## How to Add EstateOS Smoke Test to CI

The `npm run smoke:estateos` command starts the backend and runs health/readiness checks.

To integrate into GitHub Actions, add a step in `build.yml`:

```yaml
- name: EstateOS smoke test
  run: |
    cd ./backend
    npm run smoke:estateos
  env:
    NODE_ENV: test
    MI_DB_URI: mongodb://localhost:27017/estateos_test
```

Note: Requires a running MongoDB instance. The test workflow already has MongoDB.

## Documentation Compliance Check

Add to CI pipeline after the forbidden pattern check step:

```yaml
- name: Documentation compliance check
  run: node scripts/checkDocCompliance.js
```

This script verifies every `.md` file has a `Documentation Compliance Notice` and all governance docs include the mandatory compliance gate section. Fails with exit code 1 if compliance is incomplete.

## Forbidden Pattern Check

Add to root `package.json`:

```bash
grep -r "legal_clean\|safe_to_buy\|guaranteed_ownership\|no_planning_risk\|risk_free" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" . | grep -v node_modules || true
```

Or better, add a script:

```json
{
  "check:forbidden": "node scripts/checkForbiddenPatterns.mjs"
}
```

## Local Pre-commit (Optional)

```bash
# Install husky hooks
npx husky install

# Add hook
npx husky add .husky/pre-commit "npm run lint && node scripts/checkForbiddenPatterns.mjs"
```

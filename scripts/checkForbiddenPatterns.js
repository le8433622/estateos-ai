#!/usr/bin/env node

import { execSync } from 'node:child_process'
import process from 'node:process'

const FORBIDDEN = ['legal_clean', 'safe_to_buy', 'guaranteed_ownership', 'no_planning_risk', 'risk_free']
const SOURCE_DIRS = ['backend/src', 'admin/src', 'frontend/src', 'scripts', 'packages']
const EXCLUDE_PATTERNS = [
  'FORBIDDEN_LABELS',
  'forbidden',
  'containsForbiddenLabel',
  'checkForbidden',
  'KNOWN_WARNINGS',
  'KNOWN_WARNINGS.md',
]
const EXCLUDE_FILES = [
  'constants.ts',
  'ApiDocs.tsx',
  'KNOWN_WARNINGS.md',
]

console.log('\nChecking for forbidden patterns...\n')

let allPassed = true

for (const label of FORBIDDEN) {
  const foundLines = []

  for (const dir of SOURCE_DIRS) {
    try {
      const result = execSync(
        `grep -r "${label}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" "${dir}" 2>/dev/null || true`,
        { encoding: 'utf-8', cwd: process.cwd(), timeout: 10000 }
      )
      const lines = result.trim().split('\n').filter(Boolean)
      for (const l of lines) {
        foundLines.push(`${dir}: ${l}`)
      }
    } catch {
      // No matches in this dir
    }
  }

  const emissions = foundLines.filter((line) => {
    for (const ex of EXCLUDE_PATTERNS) {
      if (line.includes(ex)) {
        return false
      }
    }
    for (const file of EXCLUDE_FILES) {
      if (line.includes(file)) {
        return false
      }
    }
    return true
  })

  if (emissions.length > 0) {
    console.log(`  Found potential emission of "${label}":`)
    for (const line of emissions.slice(0, 10)) {
      console.log(`     ${line.trim()}`)
    }
    if (emissions.length > 10) {
      console.log(`     ... and ${emissions.length - 10} more`)
    }
    allPassed = false
  } else {
    console.log(`  "${label}" — only in constants/check files`)
  }
}

if (allPassed) {
  console.log('\nAll forbidden pattern checks passed\n')
  process.exit(0)
} else {
  console.log('\nForbidden patterns detected — check the lines above\n')
  process.exit(1)
}

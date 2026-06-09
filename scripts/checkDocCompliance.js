#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { readFileSync, opendirSync } from 'node:fs'
import process from 'node:process'
import path from 'node:path'

const NOTICE = '## Documentation Compliance Notice'
const GOVERANCE_FILES = [
  'AGENT.md', 'AGENTS.md', 'RULER.md', 'CHECKPOINT.md',
  'docs/IMPLEMENTATION_CONTRACT.md', 'docs/DOCUMENTATION_COMPLIANCE.md',
]

const EXCLUDE_DIRS = new Set(['node_modules', 'dist', '.git', '.github/archive', '.opencode'])

// Recursive .md file finder without external deps
function findMdFiles(dir, results = []) {
  try {
    const dirEntries = opendirSync(dir)
    let entry
    while ((entry = dirEntries.readSync()) !== null) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.has(entry.name)) {
          findMdFiles(fullPath, results)
        }
      } else if (entry.name.endsWith('.md')) {
        results.push(fullPath)
      }
    }
    dirEntries.closeSync()
  } catch {
    // Skip inaccessible dirs
  }
  return results
}

console.log('\nChecking documentation compliance...\n')

let allPassed = true
const errors = []

const allMdFiles = findMdFiles('.')

// Check 1: Every .md file must have the Documentation Compliance Notice
for (const file of allMdFiles) {
  const content = readFileSync(file, 'utf-8')
  if (!content.includes(NOTICE)) {
    errors.push(`Missing notice: ${file}`)
    allPassed = false
  }
}

if (errors.length > 0) {
  console.log(`Files missing Documentation Compliance Notice (${errors.length}):`)
  for (const err of errors) {
    console.log(`  MISSING: ${err}`)
  }
  console.log('')
} else {
  console.log(`All ${allMdFiles.length} markdown files have Documentation Compliance Notice.`)
}

// Check 2: Governance docs must have compliance gate section
for (const file of GOVERANCE_FILES) {
  const fullPath = path.resolve(file)
  try {
    const content = readFileSync(fullPath, 'utf-8')
    const hasComplianceGate =
      content.includes('Documentation Compliance Checkpoint') ||
      content.includes('Documentation Compliance Is Mandatory') ||
      content.includes('Documentation Compliance') && (
        content.includes('Mandatory Status') ||
        content.includes('Gate') ||
        content.includes('Law 0') ||
        content.includes('00. ')
      )
    if (!hasComplianceGate) {
      console.log(`MISSING compliance gate section: ${file}`)
      allPassed = false
    }
  } catch {
    console.log(`NOT FOUND: ${file} (governance doc missing)`)
    allPassed = false
  }
}

// Check 3: Core governance docs must reference PASS/N/A/STOP
const passStopDocs = ['AGENTS.md', 'RULER.md', 'CHECKPOINT.md', 'AGENT.md',
  'docs/IMPLEMENTATION_CONTRACT.md', 'docs/DOCUMENTATION_COMPLIANCE.md']
for (const file of passStopDocs) {
  const fullPath = path.resolve(file)
  try {
    const content = readFileSync(fullPath, 'utf-8')
    if (!content.includes('STOP')) {
      console.log(`MISSING STOP/PASS/N/A semantics: ${file}`)
      allPassed = false
    }
  } catch {
    console.log(`NOT FOUND: ${file} (governance doc missing)`)
    allPassed = false
  }
}

if (allPassed) {
  console.log('\nDocumentation compliance check passed.\n')
  process.exit(0)
} else {
  console.log('\nDocumentation compliance FAILED — see errors above.\n')
  process.exit(1)
}

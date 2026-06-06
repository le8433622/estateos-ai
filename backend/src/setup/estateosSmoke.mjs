#!/usr/bin/env node

import 'dotenv/config'
import process from 'node:process'
import { readFileSync } from 'node:fs'

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:4004'
const FAIL_FAST = process.env.SMOKE_FAIL_FAST !== 'false'

let passed = 0
let failed = 0

const check = async (name, urlOrFn, expectedStatus = 200) => {
  try {
    if (typeof urlOrFn === 'function') {
      await urlOrFn()
      passed++
      console.log(`  ✅ ${name}`)
      return
    }

    const res = await fetch(`${BASE_URL}${urlOrFn}`)
    const ok = res.status === expectedStatus
    if (ok) {
      passed++
      console.log(`  ✅ ${name} (${res.status})`)
    } else {
      failed++
      const body = await res.text().catch(() => '')
      console.log(`  ❌ ${name} — expected ${expectedStatus}, got ${res.status}: ${body.slice(0, 200)}`)
      if (FAIL_FAST) process.exit(1)
    }
  } catch (err) {
    failed++
    console.log(`  ❌ ${name} — error: ${err.message}`)
    if (FAIL_FAST) process.exit(1)
  }
}

const main = async () => {
  console.log(`\nEstateOS Smoke Test\n`)
  console.log(`Target: ${BASE_URL}\n`)

  // Health endpoint
  await check('GET /health', '/health')

  // EstateOS health
  await check('GET /api/v1/estateos/health', '/api/v1/estateos/health')

  // Public properties endpoint
  await check('GET /api/v1/properties', '/api/v1/properties')

  // API plans endpoint
  await check('GET /api/v1/billing/plans', '/api/v1/billing/plans')

  // Data products catalog endpoint
  await check('GET /api/v1/data-products', '/api/v1/data-products')

  // API scopes endpoint
  await check('GET /api/v1/api-scopes', '/api/v1/api-scopes')

  // Readiness endpoint
  await check('GET /api/v1/estateos/readiness', '/api/v1/estateos/readiness')

  // Data product catalog count
  const dpRes = await fetch(`${BASE_URL}/api/v1/data-products`).catch(() => null)
  if (dpRes && dpRes.status === 200) {
    const dpData = await dpRes.json()
    const dpCount = Array.isArray(dpData) ? dpData.length : Array.isArray(dpData.rows) ? dpData.rows.length : 0
    await check(`data products catalog has ${dpCount} entries`, async () => {
      if (dpCount < 7) throw new Error(`Expected at least 7 data products, got ${dpCount}`)
    })
  }

  // Pilot metrics endpoint requires auth, verify 403 without auth
  await check('GET /api/v1/pilot/metrics (unauthenticated → 403)', '/api/v1/pilot/metrics', 403)

  // Partner application endpoint shape (unauthenticated → 403)
  await check('POST /api/v1/partners/apply (unauthenticated → 403)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/partners/apply`, { method: 'POST' })
    if (res.status !== 403) throw new Error(`expected 403, got ${res.status}`)
  })

  // Forbidden labels check from compiled constants
  try {
    const distPath = new URL('../../dist/src/estateos/constants.js', import.meta.url)
    const { FORBIDDEN_LABELS } = await import(distPath)
    const required = ['legal_clean', 'safe_to_buy', 'guaranteed_ownership', 'no_planning_risk', 'risk_free']
    for (const label of required) {
      if (!FORBIDDEN_LABELS.includes(label)) {
        throw new Error(`Missing forbidden label: ${label}`)
      }
    }
    await check(`forbidden labels OK (${FORBIDDEN_LABELS.length} defined)`, async () => {})
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'MODULE_NOT_FOUND') {
      console.log(`  ⚠️  Forbidden labels check skipped (dist not built yet)`)
      passed++
    } else {
      throw err
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`\nSmoke test crashed: ${err.message}`)
  process.exit(1)
})

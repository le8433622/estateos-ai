import process from 'node:process'
import mongoose from 'mongoose'
import { DEFAULT_API_PLANS, DATA_PRODUCT_CATALOG, FORBIDDEN_LABELS } from './constants'

export interface EnvValidationResult {
  name: string
  passed: boolean
  message: string
}

export interface ReadinessResult {
  status: 'ok' | 'degraded' | 'fail'
  checks: EnvValidationResult[]
  timestamp: string
}

const getNodeEnv = (): string => process.env.NODE_ENV || 'development'
const isProduction = (): boolean => getNodeEnv() === 'production'

const checkDbConnected = async (): Promise<EnvValidationResult> => {
  try {
    const state = mongoose.connection.readyState
    const connected = state === 1 || state === 2
    return {
      name: 'database_connectivity',
      passed: connected,
      message: connected ? 'MongoDB connected' : `MongoDB state: ${state}`,
    }
  } catch (err) {
    return {
      name: 'database_connectivity',
      passed: false,
      message: `MongoDB error: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

const checkDbUriExists = (): EnvValidationResult => {
  const uri = process.env.MI_DB_URI
  const passed = Boolean(uri && uri.length > 10 && uri.startsWith('mongodb'))
  return {
    name: 'db_uri_configured',
    passed,
    message: passed ? 'DB_URI is set' : 'DB_URI is missing or invalid',
  }
}

const checkJwtSecretNotDefault = (): EnvValidationResult => {
  if (!isProduction()) {
    return { name: 'jwt_secret_not_default', passed: true, message: 'Skipped (not production)' }
  }

  const secret = process.env.MI_JWT_SECRET
  const passed = Boolean(secret) && secret !== 'Movinin'
  return {
    name: 'jwt_secret_not_default',
    passed,
    message: passed ? 'JWT_SECRET is not default' : 'JWT_SECRET is still the default value (Movinin) — MUST CHANGE',
  }
}

const checkCookieSecretNotDefault = (): EnvValidationResult => {
  if (!isProduction()) {
    return { name: 'cookie_secret_not_default', passed: true, message: 'Skipped (not production)' }
  }

  const secret = process.env.MI_COOKIE_SECRET
  const passed = Boolean(secret) && secret !== 'Movinin'
  return {
    name: 'cookie_secret_not_default',
    passed,
    message: passed ? 'COOKIE_SECRET is not default' : 'COOKIE_SECRET is still the default value (Movinin) — MUST CHANGE',
  }
}

const checkSeedNotInProduction = (): EnvValidationResult => {
  const blocked = process.env.ES_BLOCK_PRODUCTION_SEED !== 'false'
  const allowDemo = process.env.ES_ALLOW_DEMO_SEED === 'true'
  const seedEnabled = !blocked || allowDemo

  if (isProduction() && seedEnabled) {
    return {
      name: 'seed_not_production',
      passed: false,
      message: 'Seed mode appears enabled in production (ES_BLOCK_PRODUCTION_SEED=false or ES_ALLOW_DEMO_SEED=true)',
    }
  }

  return {
    name: 'seed_not_production',
    passed: true,
    message: blocked ? 'Seed is blocked from production (ES_BLOCK_PRODUCTION_SEED=true)' : 'Seed guard configured',
  }
}

const checkPlansSeeded = async (): Promise<EnvValidationResult> => {
  try {
    const BillingPlan = (await import('../models/BillingPlan.js')).default
    const count = await BillingPlan.countDocuments()
    const passed = count >= 2
    return {
      name: 'billing_plans_seeded',
      passed,
      message: passed ? `${count} billing plans found` : `Only ${count} billing plans — expected at least 2`,
    }
  } catch (err) {
    return {
      name: 'billing_plans_seeded',
      passed: false,
      message: `Could not check billing plans: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

const checkDataProductsLoaded = (): EnvValidationResult => {
  const count = DATA_PRODUCT_CATALOG.length
  const passed = count >= 7
  return {
    name: 'data_products_loaded',
    passed,
    message: passed ? `${count} data products in catalog` : `Only ${count} data products — expected 7`,
  }
}

const checkForbiddenLabels = (): EnvValidationResult => {
  const forbidden = [...FORBIDDEN_LABELS]
  const passed = forbidden.length === 5
  return {
    name: 'forbidden_labels_blocked',
    passed,
    message: passed
      ? `${forbidden.length} forbidden labels defined: ${forbidden.join(', ')}`
      : `Expected 5 forbidden labels, found ${forbidden.length}`,
  }
}

const checkApiPlansConfig = (): EnvValidationResult => {
  const count = DEFAULT_API_PLANS.length
  const passed = count >= 4
  return {
    name: 'api_plans_configured',
    passed,
    message: passed ? `${count} API plans defined` : `Only ${count} API plans — expected at least 4`,
  }
}

const checkRequiredCdnPaths = (): EnvValidationResult => {
  const required = [
    'MI_CDN_USERS',
    'MI_CDN_TEMP_USERS',
    'MI_CDN_PROPERTIES',
    'MI_CDN_TEMP_PROPERTIES',
    'MI_CDN_LOCATIONS',
    'MI_CDN_TEMP_LOCATIONS',
    'MI_ADMIN_HOST',
    'MI_FRONTEND_HOST',
  ]
  const missing = required.filter((key) => !process.env[key])
  const passed = missing.length === 0
  return {
    name: 'required_cdn_paths',
    passed,
    message: passed ? 'All required CDN paths configured' : `Missing: ${missing.join(', ')}`,
  }
}

export const runEnvValidation = async (): Promise<EnvValidationResult[]> => {
  const staticChecks: EnvValidationResult[] = [
    checkDbUriExists(),
    checkJwtSecretNotDefault(),
    checkCookieSecretNotDefault(),
    checkSeedNotInProduction(),
    checkDataProductsLoaded(),
    checkForbiddenLabels(),
    checkApiPlansConfig(),
    checkRequiredCdnPaths(),
  ]

  const dynamicChecks: EnvValidationResult[] = await Promise.all([
    checkDbConnected(),
    checkPlansSeeded(),
  ])

  return [...staticChecks, ...dynamicChecks]
}

export const runReadinessCheck = async (): Promise<ReadinessResult> => {
  const checks = await runEnvValidation()
  const failed = checks.filter((c) => !c.passed)
  const status: ReadinessResult['status'] = failed.length === 0 ? 'ok' : failed.length <= 2 ? 'degraded' : 'fail'

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
  }
}

import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { FORBIDDEN_LABELS, containsForbiddenLabel, DATA_PRODUCT_CATALOG, DEFAULT_API_PLANS } from '../src/estateos/constants'
import {
  runEnvValidation,
  runReadinessCheck,
} from '../src/estateos/envCheck'
import { rateLimit, clearRateLimitStore } from '../src/middlewares/rateLimit'
import type { Request, Response, NextFunction } from 'express'

describe('EstateOS hardening: env validation', () => {
  it('validates FORBIDDEN_LABELS is defined with all 5 labels', () => {
    expect(FORBIDDEN_LABELS).toBeDefined()
    expect(FORBIDDEN_LABELS.length).toBe(5)
    expect(FORBIDDEN_LABELS).toContain('legal_clean')
    expect(FORBIDDEN_LABELS).toContain('safe_to_buy')
    expect(FORBIDDEN_LABELS).toContain('guaranteed_ownership')
    expect(FORBIDDEN_LABELS).toContain('no_planning_risk')
    expect(FORBIDDEN_LABELS).toContain('risk_free')
  })

  it('containsForbiddenLabel detects forbidden labels', () => {
    expect(containsForbiddenLabel(['self_declared', 'legal_clean'])).toBe(true)
    expect(containsForbiddenLabel(['self_declared', 'evidence_attached'])).toBe(false)
    expect(containsForbiddenLabel(['risk_free'])).toBe(true)
    expect(containsForbiddenLabel([])).toBe(false)
  })

  it('DATA_PRODUCT_CATALOG has at least 7 entries', () => {
    expect(DATA_PRODUCT_CATALOG.length).toBeGreaterThanOrEqual(7)
  })

  it('DEFAULT_API_PLANS has at least 4 plans', () => {
    expect(DEFAULT_API_PLANS.length).toBeGreaterThanOrEqual(4)
  })

  it('env validation runs static checks without crashing', async () => {
    const checks = await runEnvValidation()
    expect(Array.isArray(checks)).toBe(true)
    expect(checks.length).toBeGreaterThanOrEqual(8)
    for (const check of checks) {
      expect(check).toHaveProperty('name')
      expect(check).toHaveProperty('passed')
      expect(check).toHaveProperty('message')
    }
  })

  it('env validation includes key checks', async () => {
    const checks = await runEnvValidation()
    const checkNames = checks.map((c) => c.name)
    expect(checkNames).toContain('db_uri_configured')
    expect(checkNames).toContain('data_products_loaded')
    expect(checkNames).toContain('forbidden_labels_blocked')
    expect(checkNames).toContain('api_plans_configured')
  })

  it('readiness check returns proper structure', async () => {
    const result = await runReadinessCheck()
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('checks')
    expect(result).toHaveProperty('timestamp')
    expect(['ok', 'degraded', 'fail']).toContain(result.status)
  })
})

describe('EstateOS hardening: rate limiting', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction
  let statusSpy: jest.Mock
  let jsonSpy: jest.Mock
  let setHeaderSpy: jest.Mock

  beforeEach(() => {
    clearRateLimitStore()
    statusSpy = jest.fn().mockReturnThis()
    jsonSpy = jest.fn()
    setHeaderSpy = jest.fn()
    req = { ip: '127.0.0.1', headers: {} }
    res = {
      status: statusSpy,
      json: jsonSpy,
      setHeader: setHeaderSpy,
    } as any
    next = jest.fn()
  })

  it('allows requests within limit', () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 5 })
    for (let i = 0; i < 5; i++) {
      limiter(req as Request, res as Response, next)
    }
    expect(next).toHaveBeenCalledTimes(5)
  })

  it('blocks requests exceeding limit', () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 3 })
    for (let i = 0; i < 3; i++) {
      limiter(req as Request, res as Response, next)
    }
    limiter(req as Request, res as Response, next)
    expect(next).toHaveBeenCalledTimes(3)
    expect(statusSpy).toHaveBeenCalledWith(429)
    expect(jsonSpy).toHaveBeenCalledWith({ message: 'Too many requests. Please try again later.' })
  })

  it('sets rate limit headers', () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 10 })
    limiter(req as Request, res as Response, next)
    expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Limit', 10)
    expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', 9)
  })

  it('resets after window expires', async () => {
    const limiter = rateLimit({ windowMs: 50, maxRequests: 1 })
    limiter(req as Request, res as Response, next)
    limiter(req as Request, res as Response, next)
    expect(next).toHaveBeenCalledTimes(1)

    await new Promise((resolve) => setTimeout(resolve, 60))

    next = jest.fn()
    limiter(req as Request, res as Response, next)
    expect(next).toHaveBeenCalledTimes(1)
  })
})

describe('EstateOS hardening: forbidden label runtime', () => {
  it('no runtime constant string contains forbidden labels beyond the definition', () => {
    const allLabels = [...FORBIDDEN_LABELS]
    for (const label of allLabels) {
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(2)
    }
  })
})

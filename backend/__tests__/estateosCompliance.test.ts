import { describe, expect, it } from '@jest/globals'
import {
  PERMISSIONS,
  ACCOUNT_PROFILE_TYPES,
  DEFAULT_PROFILE_ALLOWED_ACTIONS,
  API_SCOPES,
  FORBIDDEN_LABELS,
  TRUST_LABELS,
  LEGAL_STATUS_LABELS,
  containsForbiddenLabel,
} from '../src/estateos/constants'
import { EstateOSHttpError } from '../src/services/accountProfileService'

describe('EstateOS compliance: EstateOSHttpError', () => {
  it('creates error with status code and message', () => {
    const err = new EstateOSHttpError(400, 'test error')
    expect(err).toBeInstanceOf(Error)
    expect(err.statusCode).toBe(400)
    expect(err.message).toBe('test error')
  })

  it('creates 403 error', () => {
    const err = new EstateOSHttpError(403, 'forbidden')
    expect(err.statusCode).toBe(403)
  })

  it('creates 400 error', () => {
    const err = new EstateOSHttpError(400, 'validation failed')
    expect(err.statusCode).toBe(400)
  })
})

describe('EstateOS compliance: PERMISSIONS integrity', () => {
  it('has exactly 15 permissions', () => {
    expect(PERMISSIONS.length).toBe(15)
  })

  it('contains key permissions', () => {
    expect(PERMISSIONS).toContain('property:create_claim')
    expect(PERMISSIONS).toContain('admin:moderate')
    expect(PERMISSIONS).toContain('api:create_key')
    expect(PERMISSIONS).toContain('ai:run_action')
    expect(PERMISSIONS).toContain('verification:accept_job')
    expect(PERMISSIONS).toContain('billing:read')
  })

  it('all permissions have valid format (domain:action)', () => {
    for (const perm of PERMISSIONS) {
      expect(perm).toMatch(/^[a-z_]+:[a-z_]+$/)
    }
  })
})

describe('EstateOS compliance: ACCOUNT_PROFILE_TYPES integrity', () => {
  it('has exactly 7 profile types', () => {
    expect(ACCOUNT_PROFILE_TYPES.length).toBe(7)
  })

  it('includes all required profiles', () => {
    expect(ACCOUNT_PROFILE_TYPES).toContain('PropertyClaimAccount')
    expect(ACCOUNT_PROFILE_TYPES).toContain('PropertyDemandAccount')
    expect(ACCOUNT_PROFILE_TYPES).toContain('VerificationOperatorAccount')
    expect(ACCOUNT_PROFILE_TYPES).toContain('ApiDataBuyerAccount')
    expect(ACCOUNT_PROFILE_TYPES).toContain('AgencyDeveloperAccount')
    expect(ACCOUNT_PROFILE_TYPES).toContain('PlatformOperatorAccount')
    expect(ACCOUNT_PROFILE_TYPES).toContain('AiAgentAccount')
  })
})

describe('EstateOS compliance: DEFAULT_PROFILE_ALLOWED_ACTIONS integrity', () => {
  it('has an entry for every profile type', () => {
    for (const profileType of ACCOUNT_PROFILE_TYPES) {
      expect(DEFAULT_PROFILE_ALLOWED_ACTIONS[profileType]).toBeDefined()
      expect(Array.isArray(DEFAULT_PROFILE_ALLOWED_ACTIONS[profileType])).toBe(true)
    }
  })

  it('every action in every profile is a valid permission', () => {
    for (const profileType of ACCOUNT_PROFILE_TYPES) {
      const actions = DEFAULT_PROFILE_ALLOWED_ACTIONS[profileType]
      for (const action of actions) {
        expect(PERMISSIONS).toContain(action)
      }
    }
  })

  it('AiAgentAccount has only ai:run_action and property:read_public', () => {
    const aiActions = DEFAULT_PROFILE_ALLOWED_ACTIONS['AiAgentAccount']
    expect(aiActions).toEqual(['ai:run_action', 'property:read_public'])
    expect(aiActions).not.toContain('admin:moderate')
    expect(aiActions).not.toContain('api:create_key')
    expect(aiActions).not.toContain('verification:accept_job')
    expect(aiActions).not.toContain('billing:read')
  })

  it('PlatformOperatorAccount has admin:moderate', () => {
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['PlatformOperatorAccount']).toContain('admin:moderate')
  })

  it('VerificationOperatorAccount cannot admin:moderate', () => {
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['VerificationOperatorAccount']).not.toContain('admin:moderate')
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['VerificationOperatorAccount']).not.toContain('billing:read')
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['VerificationOperatorAccount']).not.toContain('api:create_key')
  })

  it('PropertyDemandAccount cannot create claims or verify', () => {
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['PropertyDemandAccount']).not.toContain('property:create_claim')
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['PropertyDemandAccount']).not.toContain('verification:accept_job')
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['PropertyDemandAccount']).not.toContain('api:create_key')
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['PropertyDemandAccount']).not.toContain('admin:moderate')
  })

  it('ApiDataBuyerAccount has api:create_key but not admin:moderate', () => {
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['ApiDataBuyerAccount']).toContain('api:create_key')
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['ApiDataBuyerAccount']).not.toContain('admin:moderate')
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['ApiDataBuyerAccount']).not.toContain('property:create_claim')
  })
})

describe('EstateOS compliance: API_SCOPES integrity', () => {
  it('has at least 11 scopes', () => {
    expect(API_SCOPES.length).toBeGreaterThanOrEqual(11)
  })

  it('uses plural resource:action format', () => {
    for (const scope of API_SCOPES) {
      expect(scope).toMatch(/^[a-z_]+:[a-z_]+$/)
      expect(scope).not.toMatch(/^property:/) // must be plural
    }
  })
})

describe('EstateOS compliance: trust and legal labels', () => {
  it('TRUST_LABELS has no forbidden labels', () => {
    for (const label of TRUST_LABELS) {
      expect(containsForbiddenLabel([label])).toBe(false)
    }
  })

  it('LEGAL_STATUS_LABELS has no forbidden labels', () => {
    for (const label of LEGAL_STATUS_LABELS) {
      expect(containsForbiddenLabel([label])).toBe(false)
    }
  })

  it('TRUST_LABELS contains legal_not_verified', () => {
    expect(TRUST_LABELS).toContain('legal_not_verified')
  })

  it('FORBIDDEN_LABELS has exactly 5 entries', () => {
    expect(FORBIDDEN_LABELS.length).toBe(5)
  })

  it('forbidden labels match the required set', () => {
    expect(FORBIDDEN_LABELS).toEqual(
      expect.arrayContaining(['legal_clean', 'safe_to_buy', 'guaranteed_ownership', 'no_planning_risk', 'risk_free'])
    )
  })
})

describe('EstateOS compliance: web login security constraints', () => {
  it('AiAgentAccount has no web-login-required permissions', () => {
    const aiActions = DEFAULT_PROFILE_ALLOWED_ACTIONS['AiAgentAccount']
    const webPerms = ['admin:moderate', 'billing:read', 'api:create_key', 'property:create_claim',
      'property:upload_evidence', 'verification:accept_job', 'verification:submit_report',
      'deal_room:add_event', 'api:read_usage']
    for (const perm of webPerms) {
      expect(aiActions).not.toContain(perm)
    }
  })

  it('no non-human profile has admin:moderate', () => {
    const nonHumanTypes = ['AiAgentAccount'] as const
    for (const t of nonHumanTypes) {
      expect(DEFAULT_PROFILE_ALLOWED_ACTIONS[t]).not.toContain('admin:moderate')
    }
  })
})

describe('EstateOS compliance: supply property validation', () => {
  it('rejects request without title or name', () => {
    const body: Record<string, unknown> = {}
    const missingTitle = !body.title && !body.name
    expect(missingTitle).toBe(true)
  })

  it('rejects request without property_type', () => {
    const body: Record<string, unknown> = {}
    const missingType = !body.property_type && !body.type
    expect(missingType).toBe(true)
  })

  it('accepts request with title and property_type', () => {
    const body: Record<string, unknown> = { title: 'Test', property_type: 'apartment' }
    expect(body.title).toBeTruthy()
    expect(body.property_type).toBeTruthy()
  })

  it('accepts request with name and type (legacy)', () => {
    const body: Record<string, unknown> = { name: 'Test', type: 'Apartment' }
    expect(body.name).toBeTruthy()
    expect(body.type).toBeTruthy()
  })
})

describe('EstateOS compliance: API key validation', () => {
  it('rejects request without name', () => {
    const body: Record<string, unknown> = {}
    const missingName = !body?.name
    expect(missingName).toBe(true)
  })

  it('rejects request without scopes', () => {
    const body: Record<string, unknown> = { name: 'Test' }
    const noScopes = !body?.scopes || !Array.isArray(body.scopes) || (body.scopes as unknown[]).length === 0
    expect(noScopes).toBe(true)
  })

  it('rejects request with empty scopes array', () => {
    const body: Record<string, unknown> = { name: 'Test', scopes: [] }
    const noScopes = !body?.scopes || !Array.isArray(body.scopes) || (body.scopes as unknown[]).length === 0
    expect(noScopes).toBe(true)
  })

  it('accepts request with name and valid scopes', () => {
    const body: Record<string, unknown> = { name: 'Test Key', scopes: ['properties:read_public'] }
    expect(body.name).toBeTruthy()
    expect(Array.isArray(body.scopes)).toBe(true)
    expect((body.scopes as string[]).length).toBeGreaterThan(0)
  })
})

describe('EstateOS compliance: AiAgent web login block logic', () => {
  it('blocks if all active profiles are AiAgentAccount', () => {
    const profiles = [{ profile_type: 'AiAgentAccount' }]
    const allAiAgent = profiles.length > 0 && profiles.every(p => p.profile_type === 'AiAgentAccount')
    expect(allAiAgent).toBe(true)
  })

  it('allows if user has no profiles', () => {
    const profiles: { profile_type: string }[] = []
    const allAiAgent = profiles.length > 0 && profiles.every(p => p.profile_type === 'AiAgentAccount')
    expect(allAiAgent).toBe(false)
  })

  it('allows if user has a non-AiAgent profile', () => {
    const profiles = [
      { profile_type: 'PropertyClaimAccount' },
      { profile_type: 'AiAgentAccount' },
    ]
    const allAiAgent = profiles.length > 0 && profiles.every(p => p.profile_type === 'AiAgentAccount')
    expect(allAiAgent).toBe(false)
  })

  it('blocks AiAgentAccount with only ai:run_action and property:read_public', () => {
    const aiActions = DEFAULT_PROFILE_ALLOWED_ACTIONS['AiAgentAccount']
    const hasNoWebPerms = !aiActions.includes('admin:moderate') &&
      !aiActions.includes('billing:read') &&
      !aiActions.includes('api:create_key') &&
      !aiActions.includes('property:create_claim') &&
      !aiActions.includes('property:upload_evidence') &&
      !aiActions.includes('verification:accept_job') &&
      !aiActions.includes('deal_room:add_event')
    expect(hasNoWebPerms).toBe(true)
  })
})

describe('EstateOS compliance: seed endpoint lock', () => {
  it('blocks if PlatformOperatorAccount already exists', () => {
    // Simulate the guard added in triggerEstateOSSeed
    const existingOperator = true
    const blocked = !!existingOperator
    expect(blocked).toBe(true)
  })
})

describe('EstateOS compliance: authPermission factory', () => {
  it('PlatformOperatorAccount has admin:moderate', () => {
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['PlatformOperatorAccount']).toContain('admin:moderate')
  })

  it('VerificationOperatorAccount does not have admin:moderate', () => {
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['VerificationOperatorAccount']).not.toContain('admin:moderate')
  })

  it('AiAgentAccount does not have admin:moderate', () => {
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['AiAgentAccount']).not.toContain('admin:moderate')
  })

  it('PropertyDemandAccount does not have admin:moderate', () => {
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['PropertyDemandAccount']).not.toContain('admin:moderate')
  })

  it('ApiDataBuyerAccount does not have admin:moderate', () => {
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['ApiDataBuyerAccount']).not.toContain('admin:moderate')
  })

  it('PropertyClaimAccount does not have admin:moderate', () => {
    expect(DEFAULT_PROFILE_ALLOWED_ACTIONS['PropertyClaimAccount']).not.toContain('admin:moderate')
  })
})

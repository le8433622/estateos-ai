import { describe, expect, it } from '@jest/globals'
import { FORBIDDEN_LABELS } from '../src/estateos/constants'
import { generateTrustState } from '../src/services/trustStateService'
import { generateApiKeySecret, hashApiKey, sanitizeApiScopes } from '../src/services/apiKeyService'

describe('EstateOS kernel guardrails', () => {
  it('generates cautious trust state without forbidden labels', () => {
    const trustState = generateTrustState(
      { location_precision: 'approximate', duplicate_risk_score: 0 },
      [
        { evidence_type: 'photo', review_status: 'accepted_limited', updatedAt: new Date('2026-06-05T00:00:00Z') },
        { evidence_type: 'contact_proof', review_status: 'accepted_limited', updatedAt: new Date('2026-06-05T00:00:00Z') },
      ] as any[],
      [
        {
          allowed_labels: ['operator_checked', 'verified_location', 'availability_checked'],
          submitted_at: new Date('2026-06-05T00:00:00Z'),
        },
      ] as any[],
      [] as any[],
    )

    expect(trustState.labels).toEqual(expect.arrayContaining(['evidence_attached', 'verified_photo', 'verified_contact', 'verified_location', 'availability_checked', 'operator_checked']))
    expect(trustState.legal_status).toBe('legal_not_verified')
    expect((trustState as any).sensitive_fields_redacted).toBeUndefined()

    for (const forbiddenLabel of FORBIDDEN_LABELS) {
      expect(trustState.labels).not.toContain(forbiddenLabel)
    }
  })

  it('rejects verification reports with forbidden labels', () => {
    expect(() => generateTrustState(
      { location_precision: 'district', duplicate_risk_score: 0 },
      [] as any[],
      [{ allowed_labels: ['legal_clean'], submitted_at: new Date() }] as any[],
      [] as any[],
    )).toThrow('forbidden EstateOS label')
  })

  it('hashes API keys and validates scopes', () => {
    const secret = generateApiKeySecret()
    const hash = hashApiKey(secret)

    expect(secret).toMatch(/^eos_/)
    expect(hash).not.toBe(secret)
    expect(hash).toHaveLength(64)
    expect(sanitizeApiScopes(['properties:read_public', 'properties:read_public', 'billing:read'])).toEqual(['properties:read_public', 'billing:read'])
    expect(() => sanitizeApiScopes(['properties:read_sensitive_internal'])).toThrow('Unsupported API scopes')
  })
})

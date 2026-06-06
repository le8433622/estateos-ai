import AuditLog from '../models/AuditLog'
import { ActorType } from '../estateos/constants'

export interface AuditActorContext {
  actor_type: ActorType
  actor_id: string
  account_profile?: string
  scope?: string[]
}

export interface AuditLogInput extends AuditActorContext {
  action: string
  target_type: string
  target_id?: string
  before_summary?: Record<string, unknown>
  after_summary?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

const redactSummary = (summary?: Record<string, unknown>) => {
  if (!summary) {
    return {}
  }

  const redacted = { ...summary }
  const sensitiveKeys = ['owner_identity', 'phone', 'legal_document', 'unredacted_doc', 'exact_location', 'bank_details', 'contract']

  for (const key of sensitiveKeys) {
    if (key in redacted) {
      redacted[key] = '[redacted]'
    }
  }

  return redacted
}

export const createAuditLog = async (input: AuditLogInput) => AuditLog.create({
  actor_type: input.actor_type,
  actor_id: input.actor_id,
  account_profile: input.account_profile,
  action: input.action,
  target_type: input.target_type,
  target_id: input.target_id,
  scope: input.scope || [],
  before_summary: redactSummary(input.before_summary),
  after_summary: redactSummary(input.after_summary),
  metadata: input.metadata || {},
})

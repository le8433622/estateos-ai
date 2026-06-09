export const ACCOUNT_PROFILE_TYPES = [
  'PropertyClaimAccount',
  'PropertyDemandAccount',
  'VerificationOperatorAccount',
  'ApiDataBuyerAccount',
  'AgencyDeveloperAccount',
  'PlatformOperatorAccount',
  'AiAgentAccount',
] as const

export type AccountProfileType = typeof ACCOUNT_PROFILE_TYPES[number]

export const ACCOUNT_PROFILE_STATUSES = ['applicant', 'active', 'limited', 'suspended', 'revoked'] as const
export type AccountProfileStatus = typeof ACCOUNT_PROFILE_STATUSES[number]

export const ACTOR_TYPES = ['user', 'organization', 'ai_agent', 'system'] as const
export type ActorType = typeof ACTOR_TYPES[number]

export const PERMISSIONS = [
  'property:create_claim',
  'property:update_own',
  'property:upload_evidence',
  'property:read_public',
  'property:read_partner',
  'property:read_sensitive_internal',
  'verification:accept_job',
  'verification:submit_report',
  'api:create_key',
  'api:read_usage',
  'deal_room:join',
  'deal_room:add_event',
  'billing:read',
  'admin:moderate',
  'ai:run_action',
] as const

export type Permission = typeof PERMISSIONS[number]

export const DEFAULT_PROFILE_ALLOWED_ACTIONS: Record<AccountProfileType, Permission[]> = {
  PropertyClaimAccount: [
    'property:create_claim',
    'property:update_own',
    'property:upload_evidence',
    'property:read_public',
    'deal_room:join',
    'deal_room:add_event',
  ],
  PropertyDemandAccount: [
    'property:read_public',
    'deal_room:join',
    'deal_room:add_event',
  ],
  VerificationOperatorAccount: [
    'property:read_public',
    'verification:accept_job',
    'verification:submit_report',
  ],
  ApiDataBuyerAccount: [
    'property:read_public',
    'property:read_partner',
    'api:create_key',
    'api:read_usage',
    'billing:read',
  ],
  AgencyDeveloperAccount: [
    'property:create_claim',
    'property:update_own',
    'property:upload_evidence',
    'property:read_public',
    'property:read_partner',
    'api:create_key',
    'api:read_usage',
  ],
  PlatformOperatorAccount: [
    'property:create_claim',
    'property:update_own',
    'property:upload_evidence',
    'property:read_public',
    'property:read_partner',
    'property:read_sensitive_internal',
    'verification:accept_job',
    'verification:submit_report',
    'api:create_key',
    'api:read_usage',
    'billing:read',
    'admin:moderate',
  ],
  AiAgentAccount: ['ai:run_action', 'property:read_public'],
}

export const TRUST_LABELS = [
  'self_declared',
  'evidence_attached',
  'verified_photo',
  'verified_location',
  'verified_contact',
  'availability_checked',
  'operator_checked',
  'authorized_source',
  'trusted_data_owner',
  'legal_not_verified',
] as const

export type EstateOSTrustLabel = typeof TRUST_LABELS[number]

export const LEGAL_STATUS_LABELS = [
  'legal_not_provided',
  'legal_self_declared',
  'legal_evidence_attached_redacted',
  'legal_pending_review',
  'legal_reviewed_limited',
  'legal_not_verified',
] as const

export type EstateOSLegalStatus = typeof LEGAL_STATUS_LABELS[number]

export const FORBIDDEN_LABELS = [
  'legal_clean',
  'safe_to_buy',
  'guaranteed_ownership',
  'no_planning_risk',
  'risk_free',
] as const

export const EVIDENCE_TYPES = [
  'photo',
  'video',
  'location_pin',
  'redacted_legal_doc',
  'owner_confirmation',
  'authorization_message',
  'developer_price_sheet',
  'contact_proof',
  'availability_proof',
  'field_check_photo',
] as const

export type EvidenceType = typeof EVIDENCE_TYPES[number]

export const EVIDENCE_VISIBILITIES = ['private', 'public_redacted', 'partner_redacted', 'internal'] as const
export const REDACTION_STATES = ['not_required', 'pending_redaction', 'redacted', 'restricted'] as const
export const EVIDENCE_REVIEW_STATUSES = ['submitted', 'under_review', 'accepted_limited', 'needs_more_info', 'rejected'] as const

export const CLAIM_STATES = ['self_declared', 'evidence_attached', 'verification_requested', 'operator_checked', 'rejected', 'archived'] as const
export const PROPERTY_LISTING_TYPES = ['sale', 'rent', 'lease', 'project', 'investment', 'data_claim'] as const
export const LOCATION_PRECISIONS = ['approximate', 'city', 'district', 'district_plus_area', 'exact_private'] as const
export const API_VISIBILITIES = ['public', 'partner', 'partner_trust', 'private_internal'] as const

export const VERIFICATION_JOB_STATUSES = ['open', 'assigned', 'submitted', 'reviewed', 'cancelled'] as const
export const VERIFICATION_REPORT_STATUSES = ['submitted', 'accepted', 'needs_review', 'rejected'] as const

export const RISK_FLAG_TYPES = [
  'legal_document_not_verified',
  'price_changed_recently',
  'location_precision_low',
  'duplicate_listing_risk',
  'source_authorization_missing',
  'contact_unverified',
  'availability_stale',
  'media_reuse_suspected',
  'verifier_conflict_risk',
  'api_abuse_risk',
] as const

export type RiskFlagType = typeof RISK_FLAG_TYPES[number]

export const API_SCOPES = [
  'properties:read_public',
  'properties:read_partner',
  'properties:read_trust_state',
  'properties:search',
  'properties:nearby',
  'properties:history',
  'properties:write_partner',
  'evidence:write',
  'verification:read_status',
  'analytics:read_market',
  'billing:read',
] as const

export type ApiScopeName = typeof API_SCOPES[number]

export const API_KEY_STATUSES = ['active', 'revoked'] as const
export const API_KEY_ALGOS = ['sha256', 'bcrypt'] as const
export const LEDGER_CONTRIBUTION_TYPES = [
  'created_property',
  'uploaded_evidence',
  'verified_location',
  'verified_photo',
  'verified_contact',
  'updated_availability',
  'api_property_used',
  'demand_signal_created',
  'deal_room_event_created',
  'ai_report_contributed',
] as const

export const DATA_USAGE_TYPES = ['api_property_read', 'api_trust_state_read', 'data_export', 'report_generation', 'partner_usage'] as const

export const BILLING_PLAN_TYPES = ['verification_package', 'api_subscription'] as const

export const BILLING_INTERVALS = ['one_time', 'monthly', 'yearly', 'custom'] as const

export const INVOICE_STATUSES = ['draft', 'issued', 'pending_payment', 'paid', 'overdue', 'cancelled', 'refunded'] as const

export const PAYMENT_RECORD_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const

export const SUBSCRIPTION_STATUSES = ['active', 'cancelled', 'expired'] as const

export const VERIFICATION_PACKAGE_TYPES = ['basic_cleanup_100k', 'verified_photo_contact_location_300k', 'field_check_500k_1m'] as const

export const API_PLAN_NAMES = ['free_developer', 'starter_1m_month', 'pro_5m_month', 'agency_data_10_30m_month', 'enterprise_custom'] as const

export const DEFAULT_API_PLANS: Array<{
  name: string
  price_amount: number
  billing_interval: string
  included_usage: Record<string, number>
  allowed_scopes: string[]
  rate_limit: Record<string, number>
  sort_order: number
  description: string
}> = [
  {
    name: 'Free Developer',
    price_amount: 0,
    billing_interval: 'monthly',
    included_usage: { api_calls_per_day: 100, api_calls_per_month: 3000 },
    allowed_scopes: ['properties:read_public', 'properties:read_trust_state'],
    rate_limit: { requests_per_second: 1, burst: 5 },
    sort_order: 1,
    description: 'Test and explore public property data with 100 calls/day.',
  },
  {
    name: 'Starter',
    price_amount: 1000000,
    billing_interval: 'monthly',
    included_usage: { api_calls_per_day: 1000, api_calls_per_month: 30000 },
    allowed_scopes: ['properties:read_public', 'properties:read_trust_state', 'properties:search', 'billing:read'],
    rate_limit: { requests_per_second: 5, burst: 20 },
    sort_order: 2,
    description: 'Production access with search and basic trust fields.',
  },
  {
    name: 'Pro',
    price_amount: 5000000,
    billing_interval: 'monthly',
    included_usage: { api_calls_per_day: 5000, api_calls_per_month: 150000 },
    allowed_scopes: ['properties:read_public', 'properties:read_partner', 'properties:read_trust_state', 'properties:search', 'properties:nearby', 'analytics:read_market', 'billing:read'],
    rate_limit: { requests_per_second: 10, burst: 50 },
    sort_order: 3,
    description: 'Rich data with partner scopes, analytics, and higher limits.',
  },
  {
    name: 'Agency / Data Pro',
    price_amount: 15000000,
    billing_interval: 'monthly',
    included_usage: { api_calls_per_day: 20000, api_calls_per_month: 600000 },
    allowed_scopes: ['properties:read_public', 'properties:read_partner', 'properties:read_trust_state', 'properties:search', 'properties:nearby', 'properties:history', 'properties:write_partner', 'evidence:write', 'verification:read_status', 'analytics:read_market', 'billing:read'],
    rate_limit: { requests_per_second: 25, burst: 100 },
    sort_order: 4,
    description: 'Full partner access with write APIs and agency workflows.',
  },
  {
    name: 'Enterprise',
    price_amount: 0,
    billing_interval: 'custom',
    included_usage: { api_calls_per_day: 100000, api_calls_per_month: 3000000 },
    allowed_scopes: ['properties:read_public', 'properties:read_partner', 'properties:read_trust_state', 'properties:search', 'properties:nearby', 'properties:history', 'properties:write_partner', 'evidence:write', 'verification:read_status', 'analytics:read_market', 'billing:read'],
    rate_limit: { requests_per_second: 100, burst: 500 },
    sort_order: 5,
    description: 'Custom limits, contracts, data products, and dedicated support.',
  },
]

export const VERIFICATION_PACKAGE_PLANS: Array<{
  name: string
  package_type: string
  price_amount: number
  description: string
}> = [
  {
    name: 'Basic Cleanup',
    package_type: 'basic_cleanup_100k',
    price_amount: 100000,
    description: 'Basic data cleanup and evidence organization.',
  },
  {
    name: 'Verified Photo / Contact / Location',
    package_type: 'verified_photo_contact_location_300k',
    price_amount: 300000,
    description: 'Verification of photo, contact, and location claims.',
  },
  {
    name: 'Field Check',
    package_type: 'field_check_500k_1m',
    price_amount: 750000,
    description: 'On-site field check with photo and location verification.',
  },
]
export const ROYALTY_ELIGIBILITY_STATUSES = ['candidate', 'qualified_later', 'disqualified', 'policy_pending'] as const

export const DATA_PRODUCT_TYPES = [
  'public_listing_feed',
  'api_grade_property_feed',
  'verified_location_feed',
  'fresh_inventory_feed',
  'duplicate_filtered_feed',
  'market_signal_snapshot',
  'trust_state_feed',
] as const

export type DataProductType = typeof DATA_PRODUCT_TYPES[number]

export interface DataProductDefinition {
  type: DataProductType
  name: string
  description: string
  included_fields: string[]
  required_plan: string
  required_scopes: string[]
  quality_filters: Record<string, unknown>
  location_filters: string[]
  freshness_rules: Record<string, unknown>
  sensitive_field_policy: string
  update_frequency: string
}

export const DATA_PRODUCT_CATALOG: DataProductDefinition[] = [
  {
    type: 'public_listing_feed',
    name: 'Public Listing Feed',
    description: 'Basic public property listings with approximate location and trust summary.',
    included_fields: ['id', 'title', 'property_type', 'location.city', 'location.district', 'price', 'trust_state_summary', 'quality'],
    required_plan: 'free_developer',
    required_scopes: ['properties:read_public'],
    quality_filters: { min_quality_score: 0 },
    location_filters: [],
    freshness_rules: { max_stale_days: 90 },
    sensitive_field_policy: 'redact_exact_private_location',
    update_frequency: 'daily',
  },
  {
    type: 'api_grade_property_feed',
    name: 'API-Grade Property Feed',
    description: 'High-quality properties with quality_level >= high, suitable for production apps.',
    included_fields: ['id', 'title', 'property_type', 'location.city', 'location.district', 'price', 'price_per_m2', 'size', 'trust_state', 'quality', 'freshness_score', 'evidence_context'],
    required_plan: 'pro_5m_month',
    required_scopes: ['properties:read_public', 'properties:read_partner', 'properties:read_trust_state'],
    quality_filters: { min_quality_score: 60 },
    location_filters: [],
    freshness_rules: { max_stale_days: 30 },
    sensitive_field_policy: 'redact_exact_private_location',
    update_frequency: 'daily',
  },
  {
    type: 'verified_location_feed',
    name: 'Verified Location Feed',
    description: 'Properties with verified location status, suitable for mapping and geospatial apps.',
    included_fields: ['id', 'title', 'property_type', 'location.city', 'location.district', 'price', 'trust_state', 'quality', 'latitude', 'longitude'],
    required_plan: 'starter_1m_month',
    required_scopes: ['properties:read_public', 'properties:read_trust_state'],
    quality_filters: { verified_location: true },
    location_filters: [],
    freshness_rules: { max_stale_days: 60 },
    sensitive_field_policy: 'redact_exact_private_location',
    update_frequency: 'weekly',
  },
  {
    type: 'fresh_inventory_feed',
    name: 'Fresh Inventory Feed',
    description: 'Recently updated properties with high freshness score, suitable for time-sensitive apps.',
    included_fields: ['id', 'title', 'property_type', 'location.city', 'price', 'trust_state_summary', 'quality', 'freshness_score', 'updated_at'],
    required_plan: 'starter_1m_month',
    required_scopes: ['properties:read_public', 'properties:read_trust_state'],
    quality_filters: { freshness_min: 50 },
    location_filters: [],
    freshness_rules: { max_stale_days: 14 },
    sensitive_field_policy: 'redact_exact_private_location',
    update_frequency: 'realtime',
  },
  {
    type: 'duplicate_filtered_feed',
    name: 'Duplicate-Filtered Feed',
    description: 'Properties with low duplicate risk, suitable for clean portfolio display.',
    included_fields: ['id', 'title', 'property_type', 'location.city', 'price', 'trust_state_summary', 'quality'],
    required_plan: 'pro_5m_month',
    required_scopes: ['properties:read_public', 'properties:read_trust_state'],
    quality_filters: { exclude_duplicate_risk: true },
    location_filters: [],
    freshness_rules: { max_stale_days: 60 },
    sensitive_field_policy: 'redact_exact_private_location',
    update_frequency: 'daily',
  },
  {
    type: 'market_signal_snapshot',
    name: 'Market Signal Snapshot',
    description: 'Aggregated market signals: property counts by area, quality distribution, freshness, verification coverage.',
    included_fields: ['total_properties', 'by_province', 'quality_distribution', 'verification_coverage', 'freshness_avg', 'top_property_types'],
    required_plan: 'agency_data_10_30m_month',
    required_scopes: ['analytics:read_market'],
    quality_filters: {},
    location_filters: [],
    freshness_rules: {},
    sensitive_field_policy: 'no_private_fields_included',
    update_frequency: 'daily',
  },
  {
    type: 'trust_state_feed',
    name: 'Trust State Feed',
    description: 'Full trust state and verification status for partner due diligence workflows.',
    included_fields: ['id', 'title', 'property_type', 'location.city', 'price', 'trust_state', 'quality', 'risk_flags', 'evidence_context', 'verification_context'],
    required_plan: 'agency_data_10_30m_month',
    required_scopes: ['properties:read_public', 'properties:read_partner', 'properties:read_trust_state', 'verification:read_status'],
    quality_filters: { min_quality_score: 30 },
    location_filters: [],
    freshness_rules: { max_stale_days: 45 },
    sensitive_field_policy: 'redact_exact_private_location_no_evidence',
    update_frequency: 'daily',
  },
]

export const WEBHOOK_EVENT_TYPES = [
  'property.created',
  'property.updated',
  'property.quality_changed',
  'property.trust_state_changed',
  'property.stale',
  'property.api_grade',
  'verification.completed',
] as const

export type WebhookEventType = typeof WEBHOOK_EVENT_TYPES[number]

export const PARTNER_APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'approved_for_trial',
  'approved_for_production',
  'rejected',
  'suspended',
] as const

export type PartnerApplicationStatus = typeof PARTNER_APPLICATION_STATUSES[number]

export const PARTNER_TYPES = ['real_estate_app', 'agency', 'bank', 'valuation_company', 'insurance', 'ai_app', 'market_research', 'enterprise_data_buyer'] as const

export type PartnerType = typeof PARTNER_TYPES[number]

export const AGREEMENT_TYPES = ['api_terms', 'data_visibility_terms', 'privacy_terms', 'sandbox_terms', 'production_terms'] as const

export type AgreementType = typeof AGREEMENT_TYPES[number]

export const API_KEY_ENVIRONMENTS = ['sandbox', 'production'] as const

export const PILOT_AREA = ['Vinh', 'Cua Lo', 'Nghe An'] as const

export const PILOT_TARGETS = {
  propertyCount: { min: 100, max: 500 },
  apiGradeTarget: { min: 20, max: 50 },
  sourceOwnerTarget: { min: 10, max: 30 },
  partnerTarget: { min: 3, max: 5 },
  verificationPackageTarget: 10,
} as const

export const isAllowedTrustLabel = (label: string): label is EstateOSTrustLabel => (TRUST_LABELS as readonly string[]).includes(label)

export const isAllowedLegalStatus = (label: string): label is EstateOSLegalStatus => (LEGAL_STATUS_LABELS as readonly string[]).includes(label)

export const containsForbiddenLabel = (labels: string[]) => labels.some((label) => (FORBIDDEN_LABELS as readonly string[]).includes(label))

export interface EstateOSTrustState {
  claim_level: EstateOSTrustLabel
  evidence_level: EstateOSTrustLabel
  location_status: EstateOSTrustLabel | 'not_verified'
  photo_status: EstateOSTrustLabel | 'not_verified'
  contact_status: EstateOSTrustLabel | 'not_verified'
  availability_status: EstateOSTrustLabel | 'not_verified'
  legal_status: EstateOSLegalStatus
  labels: EstateOSTrustLabel[]
  trust_score: number
  risk_score: number
  risk_flags: RiskFlagType[]
  last_checked_at: Date
}

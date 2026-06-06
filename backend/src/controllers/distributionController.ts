import mongoose from 'mongoose'
import { Request, Response } from 'express'
import Property from '../models/Property'
import WebhookEndpoint from '../models/WebhookEndpoint'
import WebhookDeliveryLog from '../models/WebhookDeliveryLog'
import { DATA_PRODUCT_CATALOG, DataProductDefinition } from '../estateos/constants'
import { EstateOSHttpError, findAccountProfileForRequest, requireAccountProfile, toAuditActor } from '../services/accountProfileService'
import { createAuditLog } from '../services/auditService'
import { logApiUsage } from '../services/apiUsageService'
import { authenticateApiKey, readApiKeySecretFromRequest } from '../services/apiKeyService'

const handleDistError = (res: Response, err: unknown) => {
  if (err instanceof EstateOSHttpError) {
    res.status(err.statusCode).send({ message: err.message })
    return
  }
  if (err instanceof Error) {
    res.status(400).send({ message: err.message })
    return
  }
  res.status(400).send({ message: 'Distribution request failed' })
}

const getAuthenticatedAccountForRequest = async (req: Request) => {
  const userId = req.user?._id
  if (userId) {
    const profile = await findAccountProfileForRequest(req, ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'])
    if (profile) {
return { profile, source: 'user' as const }
}
  }
  const secret = readApiKeySecretFromRequest(req)
  if (secret) {
    const authenticated = await authenticateApiKey(secret)
    if (authenticated) {
      return { profile: { _id: authenticated.apiKey.account_id, allowed_actions: authenticated.scopes }, source: 'api_key' as const }
    }
  }
  return null
}

const buildProductQuery = (product: DataProductDefinition, scopes: string[]) => {
  const query: Record<string, unknown> = {
    hidden: { $ne: true },
    api_visibility: { $in: scopes.includes('properties:read_partner') ? ['public', 'partner', 'partner_trust'] : ['public'] },
  }

  const qf = product.quality_filters || {}
  if (qf.min_quality_score) {
    query.quality_score = { $gte: qf.min_quality_score }
  }
  if (qf.verified_location === true) {
    query['trust_state.location_status'] = 'verified_location'
  }
  if (qf.freshness_min) {
    query.freshness_score = { $gte: qf.freshness_min }
  }
  if (qf.exclude_duplicate_risk === true) {
    query.duplicate_risk_score = { $lt: 40 }
  }
  if (product.type === 'api_grade_property_feed') {
    query.quality_level = { $in: ['high', 'api_grade'] }
  }

  return query
}

const buildProductResponse = (properties: any[], product: DataProductDefinition) =>
  properties.map((p) => {
    const shaped: Record<string, unknown> = {}
    for (const field of product.included_fields) {
      if (field === 'id') {
shaped.id = p._id.toString()
} else if (field === 'title') {
shaped.title = p.name
} else if (field === 'property_type') {
shaped.property_type = p.property_type || p.type
} else if (field === 'price') {
shaped.price = { amount: p.price, currency: 'VND' }
} else if (field === 'price_per_m2') {
shaped.price_per_m2 = p.price_per_m2
} else if (field === 'size') {
shaped.size = p.size
} else if (field === 'freshness_score') {
shaped.freshness_score = p.freshness_score
} else if (field === 'updated_at') {
shaped.updated_at = p.updatedAt
} else if (field === 'location.city') {
shaped.city = (p as any).location_public?.city
} else if (field === 'location.district') {
shaped.district = (p as any).location_public?.district
} else if (field === 'trust_state_summary') {
shaped.trust_state_summary = (p as any).trust_state
        ? { trust_score: p.trust_score, risk_score: p.risk_score, labels: (p as any).trust_state?.labels || ['self_declared'], legal_status: (p as any).trust_state?.legal_status || 'legal_not_verified' }
        : { trust_score: p.trust_score || 20, risk_score: p.risk_score || 80, labels: ['self_declared'], legal_status: 'legal_not_verified' }
} else if (field === 'trust_state') {
shaped.trust_state = (p as any).trust_state || {}
} else if (field === 'quality') {
shaped.quality = { score: (p as any).quality_score || 0, level: (p as any).quality_level || 'low' }
} else if (field === 'latitude') {
shaped.latitude = p.latitude
} else if (field === 'longitude') {
shaped.longitude = p.longitude
} else if (field === 'evidence_context') {
shaped.evidence_context = { claim_state: p.claim_state || 'self_declared' }
} else if (field === 'verification_context') {
shaped.verification_context = { claim_state: p.claim_state, trust_score: p.trust_score }
} else if (field === 'risk_flags') {
shaped.risk_flags = (p as any).trust_state?.risk_flags || []
}
    }
    shaped.sensitive_fields_redacted = true
    return shaped
  })

export const listDataProducts = async (_req: Request, res: Response) => {
  try {
    const catalog = DATA_PRODUCT_CATALOG.map(({ type, name, description, required_plan, required_scopes, update_frequency }) => ({
      type, name, description, required_plan, required_scopes, update_frequency,
    }))
    res.json({ rows: catalog, rowCount: catalog.length })
  } catch (err) {
    handleDistError(res, err)
  }
}

export const getDataProduct = async (req: Request, res: Response) => {
  try {
    const product = DATA_PRODUCT_CATALOG.find((p) => p.type === req.params.id)
    if (!product) {
      throw new EstateOSHttpError(404, 'Data product not found')
    }
    res.json(product)
  } catch (err) {
    handleDistError(res, err)
  }
}

export const previewDataProduct = async (req: Request, res: Response) => {
  try {
    const product = DATA_PRODUCT_CATALOG.find((p) => p.type === req.params.id)
    if (!product) {
      throw new EstateOSHttpError(404, 'Data product not found')
    }
    const auth = await getAuthenticatedAccountForRequest(req)
    const scopes = auth?.source === 'api_key'
      ? (auth.profile as any).allowed_actions || ['properties:read_public']
      : ['properties:read_public', 'properties:read_partner', 'properties:read_trust_state']
    const query = buildProductQuery(product, scopes)
    const properties = await Property.find(query).sort({ quality_score: -1, updatedAt: -1 }).limit(5).lean()
    const rows = buildProductResponse(properties, product)

    if (auth && auth.source === 'api_key') {
      await logApiUsage({
        req,
        authenticatedApiKey: auth.profile as any,
        endpoint: `/api/v1/data-products/${req.params.id}/preview`,
        statusCode: 200,
        scopesUsed: product.required_scopes,
        fieldsAccessed: product.included_fields,
        usageUnits: 1,
        usageType: 'api_property_read',
      })
    }

    res.json({ product_type: product.type, total_matching: properties.length, rows })
  } catch (err) {
    handleDistError(res, err)
  }
}

export const exportDataProduct = async (req: Request, res: Response) => {
  try {
    const product = DATA_PRODUCT_CATALOG.find((p) => p.type === req.params.id)
    if (!product) {
      throw new EstateOSHttpError(404, 'Data product not found')
    }
    const auth = await getAuthenticatedAccountForRequest(req)
    if (!auth) {
      throw new EstateOSHttpError(401, 'Authentication required for data export')
    }
    const scopes = auth.source === 'api_key'
      ? (auth.profile as any).allowed_actions || []
      : ['properties:read_public', 'properties:read_partner', 'properties:read_trust_state']
    const planOk = scopes.some((s: string) => product.required_scopes.includes(s))
    if (!planOk) {
      throw new EstateOSHttpError(403, `Requires scopes: ${product.required_scopes.join(', ')}`)
    }
    const limit = Math.min(Number(req.query.limit) || 100, 1000)
    const query = buildProductQuery(product, scopes)
    const properties = await Property.find(query).sort({ quality_score: -1, updatedAt: -1 }).limit(limit).lean()
    const rows = buildProductResponse(properties, product)

    if (auth.source === 'api_key') {
      await logApiUsage({
        req,
        authenticatedApiKey: auth.profile as any,
        endpoint: `/api/v1/data-products/${req.params.id}/export`,
        statusCode: 200,
        scopesUsed: product.required_scopes,
        fieldsAccessed: product.included_fields,
        usageUnits: rows.length || 1,
        usageType: 'api_property_read',
      })
    }

    res.json({ product_type: product.type, total: rows.length, rows, exported_at: new Date().toISOString() })
  } catch (err) {
    handleDistError(res, err)
  }
}

export const feedDataProduct = async (req: Request, res: Response) => {
  try {
    const product = DATA_PRODUCT_CATALOG.find((p) => p.type === req.params.id)
    if (!product) {
      throw new EstateOSHttpError(404, 'Data product not found')
    }
    const auth = await getAuthenticatedAccountForRequest(req)
    if (!auth) {
      throw new EstateOSHttpError(401, 'Authentication required for data feed')
    }
    const scopes = auth.source === 'api_key'
      ? (auth.profile as any).allowed_actions || []
      : ['properties:read_public', 'properties:read_partner', 'properties:read_trust_state']
    const planOk = scopes.some((s: string) => product.required_scopes.includes(s))
    if (!planOk) {
      throw new EstateOSHttpError(403, `Requires scopes: ${product.required_scopes.join(', ')}`)
    }
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const page = Math.max(Number(req.query.page) || 1, 1)
    const since = req.query.since ? new Date(String(req.query.since)) : undefined
    const query = buildProductQuery(product, scopes)
    if (since) {
      query.updatedAt = { $gte: since }
    }
    const skip = (page - 1) * limit
    const properties = await Property.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean()
    const total = await Property.countDocuments(query)
    const rows = buildProductResponse(properties, product)

    if (auth.source === 'api_key') {
      await logApiUsage({
        req,
        authenticatedApiKey: auth.profile as any,
        endpoint: `/api/v1/data-products/${req.params.id}/feed`,
        statusCode: 200,
        scopesUsed: product.required_scopes,
        fieldsAccessed: product.included_fields,
        usageUnits: rows.length || 1,
        usageType: 'api_property_read',
      })
    }

    res.json({ product_type: product.type, page, total, rows, has_more: skip + limit < total })
  } catch (err) {
    handleDistError(res, err)
  }
}

export const listWebhooks = async (req: Request, res: Response) => {
  try {
    const accountProfile = await findAccountProfileForRequest(req, ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'])
    if (!accountProfile) {
      throw new EstateOSHttpError(403, 'Requires API-related profile')
    }
    const webhooks = await WebhookEndpoint.find({ account_id: accountProfile._id }).sort({ createdAt: -1 }).lean()
    const rows = webhooks.map((w: any) => ({
      id: w._id.toString(),
      url: w.url,
      events: w.events,
      status: w.status,
      description: w.description,
      last_triggered_at: w.last_triggered_at,
      failure_count: w.failure_count,
    }))
    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleDistError(res, err)
  }
}

export const createWebhook = async (req: Request, res: Response) => {
  try {
    const accountProfile = await requireAccountProfile(req, ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'], 'api:create_key')
    const { url, events, description } = req.body || {}
    if (!url) {
      throw new EstateOSHttpError(400, 'URL is required')
    }
    if (!events || !Array.isArray(events) || events.length === 0) {
      throw new EstateOSHttpError(400, 'At least one event type is required')
    }
    const secret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    const webhook = await WebhookEndpoint.create({
      account_id: accountProfile._id,
      url,
      secret,
      events,
      status: 'active',
      description: description || '',
    })
    await createAuditLog({
      ...toAuditActor(req, accountProfile),
      action: 'webhook.created',
      target_type: 'WebhookEndpoint',
      target_id: webhook._id.toString(),
      after_summary: { url, events },
      metadata: { kernel: 'API Kernel' },
    })
    res.status(201).json({
      id: webhook._id.toString(),
      url: webhook.url,
      events: webhook.events,
      secret,
      status: webhook.status,
      description: webhook.description,
    })
  } catch (err) {
    handleDistError(res, err)
  }
}

export const deleteWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'Invalid webhook ID')
    }
    const accountProfile = await requireAccountProfile(req, ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'], 'api:create_key')
    const webhook = await WebhookEndpoint.findOne({ _id: id, account_id: accountProfile._id })
    if (!webhook) {
      res.sendStatus(404)
      return
    }
    await webhook.deleteOne()
    await createAuditLog({
      ...toAuditActor(req, accountProfile),
      action: 'webhook.deleted',
      target_type: 'WebhookEndpoint',
      target_id: id,
      after_summary: { url: webhook.url },
      metadata: { kernel: 'API Kernel' },
    })
    res.sendStatus(204)
  } catch (err) {
    handleDistError(res, err)
  }
}

export const listWebhookDeliveryLogs = async (req: Request, res: Response) => {
  try {
    const accountProfile = await findAccountProfileForRequest(req, ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'])
    if (!accountProfile) {
      throw new EstateOSHttpError(403, 'Requires API-related profile')
    }
    const webhookIds = await WebhookEndpoint.find({ account_id: accountProfile._id }).distinct('_id')
    const limit = Math.min(Number(req.query.limit) || 25, 100)
    const logs = await WebhookDeliveryLog.find({ webhook_id: { $in: webhookIds } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
    res.json({ rows: logs, rowCount: logs.length })
  } catch (err) {
    handleDistError(res, err)
  }
}

export const getDistributionAnalytics = async (_req: Request, res: Response) => {
  try {
    const properties = await Property.find({ source_account_id: { $exists: true } }).lean()
    const byProvince: Record<string, { total: number; api_grade: number; verified_location: number; fresh: number }> = {}
    let duplicateFilteredCount = 0
    let apiGradeCount = 0
    let verifiedLocationCount = 0
    let freshCount = 0
    const webhookCount = await WebhookEndpoint.countDocuments({ status: 'active' })
    const deliveryCount = await WebhookDeliveryLog.countDocuments()
    const successfulDeliveries = await WebhookDeliveryLog.countDocuments({ status: 'success' })

    for (const p of properties) {
      const city = (p as any).location_public?.city || 'unknown'
      if (!byProvince[city]) {
byProvince[city] = { total: 0, api_grade: 0, verified_location: 0, fresh: 0 }
}
      byProvince[city].total += 1
      const ql = (p as any).quality_level || 'low'
      if (ql === 'api_grade' || ql === 'high') {
 byProvince[city].api_grade += 1; apiGradeCount += 1 
}
      if ((p as any).trust_state?.location_status === 'verified_location') {
 byProvince[city].verified_location += 1; verifiedLocationCount += 1 
}
      if ((p.freshness_score || 0) >= 50) {
 byProvince[city].fresh += 1; freshCount += 1 
}
      if ((p.duplicate_risk_score || 0) < 40) {
duplicateFilteredCount += 1
}
    }

    res.json({
      by_area: byProvince,
      total_api_grade: apiGradeCount,
      total_verified_location: verifiedLocationCount,
      total_fresh_inventory: freshCount,
      total_duplicate_filtered: duplicateFilteredCount,
      active_webhooks: webhookCount,
      total_deliveries: deliveryCount,
      delivery_success_rate: deliveryCount > 0 ? Math.round((successfulDeliveries / deliveryCount) * 100) : 0,
    })
  } catch (err) {
    handleDistError(res, err)
  }
}

export const adminListWebhooks = async (_req: Request, res: Response) => {
  try {
    const webhooks = await WebhookEndpoint.find().sort({ createdAt: -1 }).limit(50).lean()
    res.json({ rows: webhooks, rowCount: webhooks.length })
  } catch (err) {
    handleDistError(res, err)
  }
}

export const adminListDeliveryLogs = async (_req: Request, res: Response) => {
  try {
    const logs = await WebhookDeliveryLog.find().sort({ createdAt: -1 }).limit(100).lean()
    res.json({ rows: logs, rowCount: logs.length })
  } catch (err) {
    handleDistError(res, err)
  }
}
import mongoose from 'mongoose'
import { Request, Response } from 'express'
import Property from '../models/Property'
import PropertyEvidence from '../models/PropertyEvidence'
import { computePropertyQuality, findDuplicateCandidates, refreshAllQuality, computeMarketSignals } from '../services/qualityService'
import { EstateOSHttpError } from '../services/accountProfileService'

const handleQualityError = (res: Response, err: unknown) => {
  if (err instanceof EstateOSHttpError) {
    res.status(err.statusCode).send({ message: err.message })
    return
  }
  if (err instanceof Error) {
    res.status(400).send({ message: err.message })
    return
  }
  res.status(400).send({ message: 'Quality request failed' })
}

export const getPropertyQuality = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'Invalid property ID')
    }
    const quality = await computePropertyQuality(id)
    const duplicates = await findDuplicateCandidates(id)
    res.json({ quality, duplicate_candidates: duplicates })
  } catch (err) {
    handleQualityError(res, err)
  }
}

export const getAdminQualityOverview = async (_req: Request, res: Response) => {
  try {
    const signals = await computeMarketSignals()
    res.json(signals)
  } catch (err) {
    handleQualityError(res, err)
  }
}

export const getAdminQualityQueue = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const qualityLevel = req.query.quality_level as string | undefined
    const flag = req.query.flag as string | undefined
    const query: Record<string, unknown> = { source_account_id: { $exists: true } }

    if (qualityLevel) {
      query.quality_level = qualityLevel
    }
    if (flag === 'duplicate_risk') {
      query.duplicate_risk_score = { $gte: 40 }
    }
    if (flag === 'stale') {
      const staleDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      query.updatedAt = { $lte: staleDate }
    }
    if (flag === 'needs_review') {
      query.$or = [
        { quality_level: 'low' },
        { claim_state: 'self_declared' },
      ]
    }
    if (flag === 'missing_evidence') {
      query.claim_state = { $in: ['self_declared', 'evidence_attached'] }
    }
    if (flag === 'api_grade_candidates') {
      query.quality_level = { $in: ['high', 'api_grade'] }
      query.api_visibility = { $nin: ['private_internal'] }
    }

    const properties = await Property.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()

    const rows = properties.map((p) => ({
      id: p._id.toString(),
      title: p.name,
      quality_score: (p as any).quality_score || 0,
      quality_level: (p as any).quality_level || 'low',
      claim_state: (p as any).claim_state || 'self_declared',
      freshness_score: p.freshness_score || 0,
      duplicate_risk_score: p.duplicate_risk_score || 0,
      trust_score: p.trust_score || 0,
      api_visibility: (p as any).api_visibility || 'public',
      city: (p as any).location_public?.city || '',
      updated_at: p.updatedAt,
    }))

    res.json({ rows, rowCount: rows.length })
  } catch (err) {
    handleQualityError(res, err)
  }
}

export const getAdminQualityDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'Invalid property ID')
    }
    const property = await Property.findById(id).lean()
    if (!property) {
      res.sendStatus(404)
      return
    }
    const quality = await computePropertyQuality(id)
    const duplicates = await findDuplicateCandidates(id)
    const evidenceCount = await PropertyEvidence.countDocuments({ property_id: id })
    res.json({ property, quality, duplicates, evidence_count: evidenceCount })
  } catch (err) {
    handleQualityError(res, err)
  }
}

export const postRefreshQuality = async (req: Request, res: Response) => {
  try {
    const { id } = req.params || {}
    if (id) {
      if (!mongoose.isValidObjectId(id)) {
        throw new EstateOSHttpError(400, 'Invalid property ID')
      }
      const quality = await computePropertyQuality(id)
      res.json(quality)
    } else {
      const results = await refreshAllQuality()
      res.json({ refreshed: results.length })
    }
  } catch (err) {
    handleQualityError(res, err)
  }
}

export const getSupplyQualityHints = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new EstateOSHttpError(400, 'Invalid property ID')
    }
    const quality = await computePropertyQuality(id)
    res.json({
      quality_score: quality.quality_score,
      quality_level: quality.quality_level,
      missing_fields: quality.missing_fields,
      recommended_next_actions: quality.recommended_next_actions,
      quality_flags: quality.quality_flags,
      freshness_score: quality.freshness_score,
    })
  } catch (err) {
    handleQualityError(res, err)
  }
}

export const getAdminMarketSignals = async (_req: Request, res: Response) => {
  try {
    const signals = await computeMarketSignals()
    res.json(signals)
  } catch (err) {
    handleQualityError(res, err)
  }
}
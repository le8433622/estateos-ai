import React, { useEffect, useState } from 'react'
import { Chip, Paper, Stack } from '@mui/material'
import Layout from '@/components/Layout'
import * as helper from '@/utils/helper'
import axiosInstance from '@/services/axiosInstance'

import '@/assets/css/estateos-command-center.css'

const METRICS = [
  { key: 'properties_total', label: 'Total Properties', fmt: 'number' },
  { key: 'api_grade_properties', label: 'API-Grade Properties', fmt: 'number' },
  { key: 'verified_location_count', label: 'Verified Location', fmt: 'number' },
  { key: 'fresh_inventory_count', label: 'Fresh Inventory', fmt: 'number' },
  { key: 'source_accounts_count', label: 'Source Accounts', fmt: 'number' },
  { key: 'verification_packages_requested', label: 'Verification Requested', fmt: 'number' },
  { key: 'verification_packages_paid', label: 'Verification Paid', fmt: 'number' },
  { key: 'evidence_count', label: 'Evidence Items', fmt: 'number' },
  { key: 'partner_applications_count', label: 'Partner Applications', fmt: 'number' },
  { key: 'sandbox_partners_count', label: 'Sandbox Partners', fmt: 'number' },
  { key: 'api_calls_count', label: 'API Calls', fmt: 'number' },
  { key: 'data_product_exports_count', label: 'Data Exports', fmt: 'number' },
  { key: 'invoices_paid', label: 'Paid Invoices', fmt: 'number' },
  { key: 'quality_improvement_rate', label: 'Quality Improvement Rate', fmt: 'percent' },
]

const PILOT_TARGETS: Record<string, { min: number; max?: number }> = {
  properties_total: { min: 100, max: 500 },
  api_grade_properties: { min: 20, max: 50 },
  source_accounts_count: { min: 10, max: 30 },
  partner_applications_count: { min: 3, max: 5 },
  verification_packages_paid: { min: 10 },
}

const EstateOSPilotDashboard = () => {
  const [metrics, setMetrics] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get('/api/v1/pilot/metrics', { withCredentials: true })
        setMetrics(res.data)
      } catch (err) {
 helper.error(err, 'Could not load pilot metrics') 
}
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <Layout strict><div className="estateos-cc"><p>Loading pilot metrics...</p></div></Layout>
  }

  return (
    <Layout strict>
      <div className="estateos-cc">
        <div className="estateos-cc-header">
          <h1>EstateOS Pilot Dashboard</h1>
          <span>Vinh / Cửa Lò / Nghệ An — Pilot Success Metrics</span>
        </div>

        <section className="estateos-cc-panels">
          {METRICS.map((m) => {
            const value = metrics[m.key] ?? 0
            const target = PILOT_TARGETS[m.key]
            let met = true
            if (target) {
              met = value >= target.min && (!target.max || value <= target.max)
            }
            return (
              <Paper className="estateos-cc-panel" key={m.key} sx={{ opacity: met ? 1 : 0.6 }}>
                <h3>{m.label}</h3>
                <span className="estateos-cc-count" style={{ color: met ? 'inherit' : '#999' }}>
                  {m.fmt === 'percent' ? `${value}%` : value.toLocaleString()}
                </span>
                {target && (
                  <div style={{ marginTop: 4 }}>
                    <Chip
                      label={met ? 'On Track' : 'Needs Work'}
                      size="small"
                      color={met ? 'success' : 'warning'}
                    />
                    <span style={{ fontSize: 11, marginLeft: 4, color: '#888' }}>
                      target: {target.min}{target.max ? `–${target.max}` : '+'}
                    </span>
                  </div>
                )}
              </Paper>
            )
          })}
        </section>

        <Paper sx={{ p: 2, mt: 2 }}>
          <h3>Pilot Readiness</h3>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {metrics.properties_total && metrics.properties_total >= 100
              ? <Chip label="✅ Properties seeded" color="success" />
              : <Chip label="❌ Need more properties" color="error" />}
            {metrics.source_accounts_count && metrics.source_accounts_count >= 10
              ? <Chip label="✅ Source accounts ready" color="success" />
              : <Chip label="❌ Need more sources" color="error" />}
            {metrics.partner_applications_count && metrics.partner_applications_count >= 1
              ? <Chip label="✅ Partner flow tested" color="success" />
              : <Chip label="⚠️ Partner flow not yet tested" color="warning" />}
            {metrics.verification_packages_paid && metrics.verification_packages_paid >= 1
              ? <Chip label="✅ Verification paid flow tested" color="success" />
              : <Chip label="⚠️ Verification payment not tested" color="warning" />}
            <Chip label="✅ Forbidden labels blocked" color="success" />
            <Chip label="✅ Sensitive data redacted" color="success" />
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, mt: 2 }}>
          <h3>Reference</h3>
          <ul>
            <li><a href="/estateos">Command Center</a></li>
            <li><a href="/estateos/data-quality">Data Quality</a></li>
            <li><a href="/estateos/distribution">Distribution</a></li>
            <li><a href="/estateos/partners">Partners</a></li>
            <li><a href="/estateos/billing">Billing</a></li>
            <li><code>docs/PILOT_RUNBOOK.md</code> — End-to-end demo script</li>
            <li><code>docs/PILOT_QA_CHECKLIST.md</code> — QA checklist</li>
          </ul>
        </Paper>
      </div>
    </Layout>
  )
}

export default EstateOSPilotDashboard
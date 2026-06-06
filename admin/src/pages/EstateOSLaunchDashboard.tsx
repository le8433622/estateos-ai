import React, { useEffect, useState } from 'react'
import { Chip, Paper, Stack } from '@mui/material'
import Layout from '@/components/Layout'
import axiosInstance from '@/services/axiosInstance'
import '@/assets/css/estateos-command-center.css'

interface EnvCheck {
  name: string
  passed: boolean
  message: string
}

const CHECK_LABELS: Record<string, string> = {
  database_connectivity: 'Database Connected',
  db_uri_configured: 'DB URI Configured',
  jwt_secret_not_default: 'JWT Secret Not Default (Prod)',
  cookie_secret_not_default: 'Cookie Secret Not Default (Prod)',
  seed_not_production: 'Seed Blocked in Production',
  billing_plans_seeded: 'Billing Plans Seeded',
  data_products_loaded: 'Data Products Loaded',
  forbidden_labels_blocked: 'Forbidden Labels Blocked',
  api_plans_configured: 'API Plans Configured',
  required_cdn_paths: 'Required CDN Paths',
}

const MANUAL_CHECKS = [
  { key: 'build_lint_pass', label: 'Latest Build/Lint Pass', link: null },
  { key: 'sensitive_redaction', label: 'Sensitive Data Redacted', link: null },
  { key: 'api_key_hashing', label: 'API Keys Hashed at Rest', link: null },
  { key: 'partner_sandbox_ready', label: 'Partner Sandbox Ready', link: null },
  { key: 'pilot_seed_present', label: 'Pilot Seed/Data Present', link: null },
  { key: 'api_key_system_ready', label: 'API Key System Ready', link: '/estateos/partners' },
]

const EstateOSLaunchDashboard = () => {
  const [envChecks, setEnvChecks] = useState<EnvCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [manualStatus, setManualStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchEnvValidation = async () => {
      try {
        const res = await axiosInstance.get('/api/v1/estateos/env-validation')
        setEnvChecks(res.data.checks || [])
      } catch {
        setEnvChecks([])
      } finally {
        setLoading(false)
      }
    }
    fetchEnvValidation()
  }, [])

  const passedCount = envChecks.filter((c) => c.passed).length
  const failedCount = envChecks.filter((c) => !c.passed).length
  const manualPassed = Object.values(manualStatus).filter(Boolean).length

  return (
    <Layout strict admin>
      <div className="estateos-page">
        <h1>EstateOS Launch Gate</h1>
        <p>Launch readiness checklist for Vinh / Cửa Lò / Nghệ An pilot.</p>

        <Paper sx={{ p: 2, mt: 2 }}>
          <Stack spacing={1}>
            <h2>Environment Validation ({passedCount}/{envChecks.length} passed{failedCount > 0 ? `, ${failedCount} failed` : ''})</h2>
            {loading && <p>Loading environment checks...</p>}
            {envChecks.map((check) => (
              <Chip
                key={check.name}
                label={`${CHECK_LABELS[check.name] || check.name}: ${check.message}`}
                color={check.passed ? 'success' : 'error'}
                variant="outlined"
                sx={{ justifyContent: 'flex-start', height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal' } }}
              />
            ))}
            {!loading && envChecks.length === 0 && (
              <Chip label="Could not load environment checks — backend unreachable" color="warning" />
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, mt: 2 }}>
          <Stack spacing={1}>
            <h2>Manual Launch Checklist ({manualPassed}/{MANUAL_CHECKS.length})</h2>
            {MANUAL_CHECKS.map((check) => (
              <Chip
                key={check.key}
                label={`${check.label}${manualStatus[check.key] ? ' ✅' : ' ⬜'}`}
                color={manualStatus[check.key] ? 'success' : 'default'}
                variant="outlined"
                onClick={() => setManualStatus((prev) => ({ ...prev, [check.key]: !prev[check.key] }))}
                sx={{ cursor: 'pointer', justifyContent: 'flex-start', height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal' } }}
              />
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, mt: 2 }}>
          <h3>Reference</h3>
          <ul>
            <li><a href="/estateos">Command Center</a></li>
            <li><a href="/estateos/pilot">Pilot Dashboard</a></li>
            <li><code>docs/SECURITY_LAUNCH_CHECKLIST.md</code> — Security checklist</li>
            <li><code>docs/BACKUP_ROLLBACK.md</code> — Backup and rollback guide</li>
            <li><code>docs/ENVIRONMENT.md</code> — Environment configuration</li>
            <li><code>docs/CI_EXPECTATIONS.md</code> — CI/CD pipeline expectations</li>
            <li><code>docs/PILOT_RUNBOOK.md</code> — End-to-end demo script</li>
            <li><code>docs/PILOT_QA_CHECKLIST.md</code> — QA checklist</li>
          </ul>
        </Paper>
      </div>
    </Layout>
  )
}

export default EstateOSLaunchDashboard

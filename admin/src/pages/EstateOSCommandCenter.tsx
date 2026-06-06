import React, { useEffect, useState } from 'react'
import { Button, Chip, CircularProgress, Paper } from '@mui/material'
import Layout from '@/components/Layout'
import * as helper from '@/utils/helper'
import * as EstateOSService from '@/services/EstateOSService'

import '@/assets/css/estateos-command-center.css'

const PANELS = [
  { key: 'properties', label: 'Properties' },
  { key: 'property-claims', label: 'Claims' },
  { key: 'property-evidence', label: 'Evidence' },
  { key: 'verification-jobs', label: 'Verification Jobs' },
  { key: 'verification-reports', label: 'Reports' },
  { key: 'risk-flags', label: 'Risk Flags' },
  { key: 'api-keys', label: 'API Keys' },
  { key: 'api-usage', label: 'API Usage' },
  { key: 'contribution-ledger', label: 'Contribution Ledger' },
  { key: 'data-usage-ledger', label: 'Usage Ledger' },
  { key: 'audit-logs', label: 'Audit Logs' },
]

const JSONBlock = ({ value }: { value: unknown }) => (
  <pre className="estateos-json">
    {JSON.stringify(value, null, 2)}
  </pre>
)

const EstateOSCommandCenter = () => {
  const [commandCenter, setCommandCenter] = useState<EstateOSService.EstateOSCommandCenter>()
  const [activePanel, setActivePanel] = useState(PANELS[0].key)
  const [panelRows, setPanelRows] = useState<Record<string, unknown>[]>([])
  const [panelRowCount, setPanelRowCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [panelLoading, setPanelLoading] = useState(false)

  const loadPanel = async (panelKey: string) => {
    setPanelLoading(true)
    setActivePanel(panelKey)

    try {
      const data = await EstateOSService.getOpsCollection(panelKey)
      setPanelRows(data.rows)
      setPanelRowCount(data.rowCount)
    } catch (err) {
      helper.error(err, 'Could not load EstateOS operational data')
    } finally {
      setPanelLoading(false)
    }
  }

  const loadCommandCenter = async () => {
    setLoading(true)

    try {
      const data = await EstateOSService.getCommandCenter()
      setCommandCenter(data)
      await loadPanel(activePanel)
    } catch (err) {
      helper.error(err, 'Could not load EstateOS Command Center')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommandCenter()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout strict admin>
      <div className="estateos-command-center">
        <div className="estateos-hero">
          <div>
            <p className="estateos-eyebrow">EstateOS Operational Layer</p>
            <h1>Command Center</h1>
            <p>
              Inspect claim-based property data, evidence, verification, trust state, API usage, ledgers, and audit logs.
              This console does not expose raw private evidence or legal-clean claims.
            </p>
          </div>
          <Button variant="contained" className="btn-primary" onClick={loadCommandCenter} disabled={loading || panelLoading}>
            Refresh
          </Button>
        </div>

        {loading && <CircularProgress />}

        {!loading && commandCenter && (
          <>
            <div className="estateos-counts">
              {Object.entries(commandCenter.counts).map(([key, value]) => (
                <Paper className="estateos-count-card" key={key}>
                  <span>{key}</span>
                  <strong>{value}</strong>
                </Paper>
              ))}
            </div>

            <Paper className="estateos-section">
              <div className="estateos-section-header">
                <h2>Recent Kernel Activity</h2>
                <Chip label="redacted operational view" size="small" />
              </div>
              <div className="estateos-recent-grid">
                {Object.entries(commandCenter.recent).map(([key, rows]) => (
                  <div className="estateos-recent" key={key}>
                    <h3>{key}</h3>
                    <JSONBlock value={rows.slice(0, 2)} />
                  </div>
                ))}
              </div>
            </Paper>

            <Paper className="estateos-section">
              <div className="estateos-section-header">
                <div>
                  <h2>Inspect Kernel Collections</h2>
                  <p>Every read is audit-logged. Evidence file references are redacted.</p>
                </div>
                <Chip label={`${panelRowCount} rows`} size="small" />
              </div>
              <div className="estateos-panel-buttons">
                {PANELS.map((panel) => (
                  <Button
                    key={panel.key}
                    variant={activePanel === panel.key ? 'contained' : 'outlined'}
                    className={activePanel === panel.key ? 'btn-primary' : ''}
                    onClick={() => loadPanel(panel.key)}
                    disabled={panelLoading}
                    size="small"
                  >
                    {panel.label}
                  </Button>
                ))}
              </div>
              {panelLoading ? <CircularProgress size={24} /> : <JSONBlock value={panelRows} />}
            </Paper>
          </>
        )}
      </div>
    </Layout>
  )
}

export default EstateOSCommandCenter

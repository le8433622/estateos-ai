import React, { useEffect, useState } from 'react'
import { Button, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Stack } from '@mui/material'
import Layout from '@/components/Layout'
import * as helper from '@/utils/helper'
import * as QualityService from '@/services/QualityService'

import '@/assets/css/estateos-command-center.css'

const TABS = [
  { key: 'signals', label: 'Market Signals' },
  { key: 'needs_review', label: 'Needs Review' },
  { key: 'missing_evidence', label: 'Missing Evidence' },
  { key: 'duplicate_risk', label: 'Duplicate Risk' },
  { key: 'stale', label: 'Stale' },
  { key: 'api_grade', label: 'API Grade Candidates' },
]

const EstateOSDataQuality = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].key)
  const [signals, setSignals] = useState<any>(null)
  const [queueRows, setQueueRows] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState<any>(null)
  const [qualityDetail, setQualityDetail] = useState<any>(null)

  const loadSignals = async () => {
    try {
      const data = await QualityService.getMarketSignals()
      setSignals(data)
    } catch (err) {
      helper.error(err, 'Could not load market signals')
    }
  }

  const loadQueue = async (flag?: string) => {
    try {
      const data = await QualityService.getQualityQueue(flag || activeTab === 'needs_review' ? 'needs_review' : activeTab)
      setQueueRows(data.rows || [])
    } catch (err) {
      helper.error(err, 'Could not load quality queue')
    }
  }

  useEffect(() => {
    if (activeTab === 'signals') {
      loadSignals()
    } else {
      loadQueue(activeTab)
    }
  }, [activeTab])

  const handleViewDetail = async (id: string) => {
    try {
      const data = await QualityService.getQualityDetail(id)
      setSelectedProperty(data.property)
      setQualityDetail(data.quality)
    } catch (err) {
      helper.error(err, 'Could not load property detail')
    }
  }

  const levelColor = (level: string) => {
    const colors: Record<string, string> = { low: 'error', medium: 'warning', high: 'info', api_grade: 'success' }
    return (colors[level] || 'default') as 'error' | 'warning' | 'info' | 'success' | 'default'
  }

  return (
    <Layout strict>
      <div className="estateos-cc">
        <div className="estateos-cc-header">
          <h1>EstateOS Data Quality Engine</h1>
          <span>Property quality scoring, duplicate detection, freshness tracking, market signals</span>
        </div>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'contained' : 'text'}
              onClick={() => {
 setActiveTab(tab.key); setSelectedProperty(null); setQualityDetail(null) 
}}
              size="small"
            >
              {tab.label}
            </Button>
          ))}
          <Button variant="outlined" size="small" onClick={async () => {
            await QualityService.refreshQuality()
            if (activeTab === 'signals') {
 loadSignals() 
} else {
 loadQueue(activeTab) 
}
          }}>
            Refresh Quality
          </Button>
        </Stack>

        {activeTab === 'signals' && signals && (
          <>
            <section className="estateos-cc-panels">
              <Paper className="estateos-cc-panel">
                <h3>Total Properties</h3>
                <span className="estateos-cc-count">{signals.total_properties}</span>
              </Paper>
              <Paper className="estateos-cc-panel">
                <h3>API Grade</h3>
                <span className="estateos-cc-count">{signals.api_grade_count}</span>
              </Paper>
              <Paper className="estateos-cc-panel">
                <h3>Duplicate Risk</h3>
                <span className="estateos-cc-count">{signals.duplicate_risk_count}</span>
              </Paper>
              <Paper className="estateos-cc-panel">
                <h3>Stale Listings</h3>
                <span className="estateos-cc-count">{signals.stale_count}</span>
              </Paper>
              <Paper className="estateos-cc-panel">
                <h3>Verification Coverage</h3>
                <span className="estateos-cc-count">{signals.verification_coverage}%</span>
              </Paper>
              <Paper className="estateos-cc-panel">
                <h3>Avg Freshness</h3>
                <span className="estateos-cc-count">{signals.freshness_avg}</span>
              </Paper>
            </section>

            <Paper sx={{ p: 2, mt: 2 }}>
              <h3>Quality Distribution</h3>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {Object.entries(signals.quality_distribution || {}).map(([level, count]) => (
                      <TableCell key={level}><Chip label={`${level}: ${count}`} size="small" color={levelColor(level)} /></TableCell>
                    ))}
                  </TableRow>
                </TableHead>
              </Table>
            </Paper>

            <Paper sx={{ p: 2, mt: 2 }}>
              <h3>Properties by Province</h3>
              <Table size="small">
                <TableBody>
                  {Object.entries(signals.by_province || {}).map(([city, count]) => (
                    <TableRow key={city}>
                      <TableCell>{city}</TableCell>
                      <TableCell>{String(count)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Paper sx={{ p: 2, mt: 2 }}>
              <h3>Top Property Types</h3>
              <Table size="small">
                <TableBody>
                  {(signals.top_property_types || []).map((t: any) => (
                    <TableRow key={t.type}>
                      <TableCell>{t.type}</TableCell>
                      <TableCell>{t.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}

        {activeTab !== 'signals' && !selectedProperty && (
          <Paper className="estateos-cc-panel" sx={{ p: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Quality</TableCell>
                  <TableCell>Freshness</TableCell>
                  <TableCell>Duplicate Risk</TableCell>
                  <TableCell>Claim State</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queueRows.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.city}</TableCell>
                    <TableCell><Chip label={`${row.quality_level} (${row.quality_score})`} size="small" color={levelColor(row.quality_level)} /></TableCell>
                    <TableCell>{row.freshness_score}</TableCell>
                    <TableCell>{row.duplicate_risk_score >= 40 ? <Chip label={`${row.duplicate_risk_score}`} color="error" size="small" /> : row.duplicate_risk_score}</TableCell>
                    <TableCell>{row.claim_state}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleViewDetail(row.id)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {selectedProperty && qualityDetail && (
          <Paper sx={{ p: 2 }}>
            <Button size="small" onClick={() => setSelectedProperty(null)} sx={{ mb: 2 }}>Back to Queue</Button>
            <h3>{selectedProperty.name}</h3>
            <p><strong>Quality Score:</strong> {qualityDetail.quality_score} — <Chip label={qualityDetail.quality_level} size="small" color={levelColor(qualityDetail.quality_level)} /></p>
            <p><strong>Freshness Score:</strong> {qualityDetail.freshness_score}</p>
            <p><strong>Duplicate Risk:</strong> {selectedProperty.duplicate_risk_score || 0}</p>
            <p><strong>Trust Score:</strong> {selectedProperty.trust_score || 20}</p>
            <p><strong>Claim State:</strong> {selectedProperty.claim_state}</p>
            <p><strong>API Visibility:</strong> {selectedProperty.api_visibility}</p>
            <p><strong>Evidence Count:</strong> {qualityDetail.evidence_count}</p>

            <h4>Missing Fields</h4>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
              {(qualityDetail.missing_fields || []).length === 0
                ? <span>None</span>
                : qualityDetail.missing_fields.map((f: string) => <Chip key={f} label={f} size="small" variant="outlined" />)}
            </Stack>

            <h4>Recommended Actions</h4>
            <ul>
              {(qualityDetail.recommended_next_actions || []).map((a: string, i: number) => <li key={i}>{a}</li>)}
            </ul>

            <h4>Quality Flags</h4>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(qualityDetail.quality_flags || []).length === 0
                ? <span>None</span>
                : qualityDetail.quality_flags.map((f: string) => <Chip key={f} label={f} size="small" color="warning" />)}
            </Stack>

            {(qualityDetail.duplicates || []).length > 0 && (
              <>
                <h4>Duplicate Candidates</h4>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Matched Property</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Reasons</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {qualityDetail.duplicates.map((d: any) => (
                      <TableRow key={d.matched_property_id}>
                        <TableCell>{d.matched_property_id}</TableCell>
                        <TableCell>{d.similarity_score}</TableCell>
                        <TableCell>{d.match_reasons?.join(', ')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={async () => {
              await QualityService.refreshQuality(selectedProperty._id)
              handleViewDetail(selectedProperty._id)
            }}>
              Refresh Quality Score
            </Button>
          </Paper>
        )}
      </div>
    </Layout>
  )
}

export default EstateOSDataQuality
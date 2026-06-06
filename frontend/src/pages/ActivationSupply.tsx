import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, Stack } from '@mui/material'
import { Add as AddIcon, Lightbulb as HintIcon } from '@mui/icons-material'
import axiosInstance from '@/services/axiosInstance'
import Layout from '@/components/Layout'
import * as activationService from '@/services/EstateOSActivationService'
import { useUserContext, UserContextType } from '@/context/UserContext'

import '@/assets/css/api-docs.css'

const ActivationSupply = () => {
  const navigate = useNavigate()
  const { user } = useUserContext() as UserContextType
  const [profiles, setProfiles] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [qualityHints, setQualityHints] = useState<Record<string, any>>({})

  const loadHints = async (propId: string) => {
    if (qualityHints[propId]) {
return
}
    try {
      const res = await axiosInstance.get(`/api/v1/quality/supply/${propId}/hints`, { withCredentials: true })
      setQualityHints((prev) => ({ ...prev, [propId]: res.data }))
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const profileData = await activationService.listOwnProfiles()
        setProfiles(profileData.rows || [])
        const hasSupplyProfile = (profileData.rows || []).some(
          (p: any) => ['PropertyClaimAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'].includes(p.profile_type),
        )
        if (hasSupplyProfile) {
          const propData = await activationService.listOwnSupplyProperties()
          setProperties(propData.rows || [])
        }
      } catch {
        // not loaded
      }
    }
    init()
  }, [user])

  const handleCreateProfile = async () => {
    try {
      await activationService.createOwnProfile({ profile_type: 'PropertyClaimAccount' })
      const profileData = await activationService.listOwnProfiles()
      setProfiles(profileData.rows || [])
    } catch {
      // silently fail
    }
  }

  const hasSupplyProfile = profiles.some(
    (p: any) => ['PropertyClaimAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'].includes(p.profile_type),
  )
  const supplyProfiles = profiles.filter(
    (p: any) => ['PropertyClaimAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'].includes(p.profile_type),
  )

  return (
    <Layout strict>
      <main className="api-docs">
        <section className="api-docs-hero">
          <p>EstateOS Network</p>
          <h1>Supply Activation</h1>
          <span>Submit property data claims, attach evidence, and manage your contributed data assets.</span>
        </section>

        <section className="api-docs-grid">
          <Paper className="api-docs-card">
            <h2>Your Supply Profiles</h2>
            {supplyProfiles.length === 0 ? (
              <p>No supply profile yet. Create one to start submitting property data.</p>
            ) : (
              supplyProfiles.map((p: any) => (
                <div key={p._id}>
                  <Chip label={p.profile_type} size="small" /> Status: {p.status} Trust: {p.trust_score}
                </div>
              ))
            )}
            {!hasSupplyProfile && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateProfile} sx={{ mt: 2 }}>
                Activate Supply Profile
              </Button>
            )}
          </Paper>

          {hasSupplyProfile && (
            <Paper className="api-docs-card">
              <h2>Your Properties</h2>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/supply/new')} sx={{ mb: 2 }}>
                New Property Claim
              </Button>
              {properties.length === 0 ? (
                <p>No property claims yet.</p>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Claim State</TableCell>
                      <TableCell>Quality</TableCell>
                      <TableCell>Trust Score</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {properties.map((row: any) => (
                      <TableRow key={row.claim?.id || row.property?.id}>
                        <TableCell>{row.property?.title || 'Untitled'}</TableCell>
                        <TableCell><Chip label={row.claim?.claim_state || 'self_declared'} size="small" /></TableCell>
                        <TableCell>
                          <Chip
                            label={`${row.property?.trust_state_summary?.quality_level || 'low'} (${row.property?.trust_state_summary?.quality_score || '?'})`}
                            size="small"
                            color={row.property?.trust_state_summary?.quality_level === 'api_grade' ? 'success' : row.property?.trust_state_summary?.quality_level === 'high' ? 'info' : row.property?.trust_state_summary?.quality_level === 'medium' ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{row.property?.trust_state_summary?.trust_score || 20}</TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => navigate(`/supply/${row.property?.id}`)}>View</Button>
                          <Button size="small" onClick={() => loadHints(row.property?.id)}><HintIcon fontSize="small" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {Object.keys(qualityHints).length > 0 && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: '#fafafa' }}>
                  <h4>Quality Improvement Hints</h4>
                  {Object.entries(qualityHints).map(([propId, hint]: [string, any]) => (
                    <div key={propId}>
                      <p><strong>Property:</strong> {propId}</p>
                      <p><strong>Quality Level:</strong> {hint.quality_level} ({hint.quality_score})</p>
                      {hint.missing_fields?.length > 0 && (
                        <p><strong>Missing:</strong> {hint.missing_fields.join(', ')}</p>
                      )}
                      {hint.recommended_next_actions?.length > 0 && (
                        <div>
                          <strong>Recommended:</strong>
                          <ul>
                            {hint.recommended_next_actions.map((a: string, i: number) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                      )}
                      {hint.quality_flags?.length > 0 && (
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {hint.quality_flags.map((f: string) => <Chip key={f} label={f} size="small" color="warning" />)}
                        </Stack>
                      )}
                    </div>
                  ))}
                </Paper>
              )}
            </Paper>
          )}
        </section>
      </main>
    </Layout>
  )
}

export default ActivationSupply

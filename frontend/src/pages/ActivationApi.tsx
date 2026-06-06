import React, { useState, useEffect } from 'react'
import { Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, Stack, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select } from '@mui/material'
import { Add as AddIcon, ContentCopy as CopyIcon, Speed as SpeedIcon } from '@mui/icons-material'
import { toast } from 'react-toastify'
import Layout from '@/components/Layout'
import * as activationService from '@/services/EstateOSActivationService'
import axiosInstance from '@/services/axiosInstance'
import { useUserContext, UserContextType } from '@/context/UserContext'

import '@/assets/css/api-docs.css'

const AVAILABLE_SCOPES = [
  'properties:read_public',
  'properties:read_partner',
  'properties:read_trust_state',
  'properties:search',
  'properties:nearby',
  'billing:read',
]

const ActivationApi = () => {
  const { user } = useUserContext() as UserContextType
  const [profiles, setProfiles] = useState<any[]>([])
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [usage, setUsage] = useState<any[]>([])
  const [currentPlan, setCurrentPlan] = useState<any>(null)
  const [currentSub, setCurrentSub] = useState<any>(null)
  const [billingUsage, setBillingUsage] = useState<any>(null)
  const [billingPlans, setBillingPlans] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['properties:read_public'])
  const [newKeySecret, setNewKeySecret] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const profileData = await activationService.listOwnProfiles()
        setProfiles(profileData.rows || [])
        const hasApiProfile = (profileData.rows || []).some(
          (p: any) => ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'].includes(p.profile_type),
        )
        if (hasApiProfile) {
          const [keysData, usageData, planUsageData, plansData] = await Promise.all([
            activationService.listOwnApiKeys(),
            activationService.getOwnApiUsage(),
            axiosInstance.get('/api/v1/billing/usage', { withCredentials: true }).then((r) => r.data),
            axiosInstance.get('/api/v1/billing/plans?type=api_subscription', { withCredentials: true }).then((r) => r.data),
          ])
          setApiKeys(keysData.rows || [])
          setUsage(usageData.rows || [])
          setCurrentPlan(planUsageData.plan)
          setCurrentSub(planUsageData.subscription)
          setBillingUsage(planUsageData.usage)
          setBillingPlans(plansData.rows || [])
        }
      } catch {
        // not loaded
      }
    }
    init()
  }, [user])

  const handleCreateProfile = async () => {
    try {
      await activationService.createOwnProfile({ profile_type: 'ApiDataBuyerAccount' })
      const profileData = await activationService.listOwnProfiles()
      setProfiles(profileData.rows || [])
      toast.success('API buyer profile activated')
    } catch {
      toast.error('Failed to activate profile')
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Key name is required')
      return
    }
    try {
      const res = await axiosInstance.post('/api/v1/api-keys', {
        name: newKeyName,
        scopes: newKeyScopes,
      }, { withCredentials: true })
      setNewKeySecret(res.data.secret)
      setApiKeys((prev) => [res.data.key, ...prev])
      toast.success('API key created. Copy the secret now.')
    } catch {
      toast.error('Failed to create API key')
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    try {
      await axiosInstance.delete(`/api/v1/api-keys/${keyId}`, { withCredentials: true })
      setApiKeys((prev) => prev.map((k) => k.id === keyId ? { ...k, status: 'revoked' } : k))
      toast.success('Key revoked')
    } catch {
      toast.error('Failed to revoke key')
    }
  }

  const hasApiProfile = profiles.some(
    (p: any) => ['ApiDataBuyerAccount', 'AgencyDeveloperAccount', 'PlatformOperatorAccount'].includes(p.profile_type),
  )

  return (
    <Layout strict>
      <main className="api-docs">
        <section className="api-docs-hero">
          <p>EstateOS Network</p>
          <h1>API Buyer Activation</h1>
          <span>Create scoped API keys, monitor usage, and access property data programmatically.</span>
        </section>

        <section className="api-docs-grid">
          <Paper className="api-docs-card">
            <h2>Your API Profile</h2>
            {!hasApiProfile ? (
              <>
                <p>No API buyer profile yet. Activate one to start creating API keys.</p>
                <Button variant="contained" onClick={handleCreateProfile}>Activate API Buyer Profile</Button>
              </>
            ) : (
              <p>API buyer profile is active. Your keys and usage are shown below.</p>
            )}
          </Paper>

          {hasApiProfile && (
            <>
              <Paper className="api-docs-card">
                <h2>API Keys</h2>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
 setNewKeySecret(''); setNewKeyName(''); setDialogOpen(true) 
}} sx={{ mb: 2 }}>
                  Create API Key
                </Button>
                {apiKeys.length === 0 ? (
                  <p>No API keys yet.</p>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Prefix</TableCell>
                        <TableCell>Scopes</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {apiKeys.map((key: any) => (
                        <TableRow key={key.id}>
                          <TableCell>{key.name}</TableCell>
                          <TableCell><code>{key.key_prefix}...</code></TableCell>
                          <TableCell>{(key.scopes || []).join(', ')}</TableCell>
                          <TableCell><Chip label={key.status} size="small" color={key.status === 'active' ? 'success' : 'default'} /></TableCell>
                          <TableCell>
                            {key.status === 'active' && (
                              <Button size="small" color="error" onClick={() => handleRevokeKey(key.id)}>Revoke</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>

              <Paper className="api-docs-card">
                <h2>Recent API Usage</h2>
                {usage.length === 0 ? (
                  <p>No usage recorded yet.</p>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Endpoint</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Units</TableCell>
                        <TableCell>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usage.slice(0, 10).map((ev: any) => (
                        <TableRow key={ev._id}>
                          <TableCell><code>{ev.endpoint}</code></TableCell>
                          <TableCell>{ev.status_code}</TableCell>
                          <TableCell>{ev.usage_units}</TableCell>
                          <TableCell>{ev.created_at ? new Date(ev.created_at).toLocaleString() : ''}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>

              <Paper className="api-docs-card">
                <h2><SpeedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />Current Plan & Usage</h2>
                {currentPlan ? (
                  <div>
                    <p><strong>Plan:</strong> {currentPlan.name} ({currentPlan.price_amount?.toLocaleString()} {currentPlan.currency}/{currentPlan.billing_interval})</p>
                    {billingUsage && (
                      <div>
                        <p>Daily Usage: <strong>{billingUsage.daily}</strong> / {billingUsage.dailyLimit}</p>
                        <p>Monthly Usage: <strong>{billingUsage.monthly}</strong> / {billingUsage.monthlyLimit}</p>
                      </div>
                    )}
                    <p><strong>Scopes:</strong> {(currentPlan.allowed_scopes || []).join(', ')}</p>
                  </div>
                ) : (
                  <div>
                    <p>No active subscription plan. Select one below or continue with free developer tier.</p>
                  </div>
                )}
              </Paper>

              <Paper className="api-docs-card">
                <h2>Available Plans</h2>
                {billingPlans.length === 0 ? (
                  <p>Loading plans...</p>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Plan</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Daily Limit</TableCell>
                        <TableCell>Scopes</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billingPlans.map((plan: any) => (
                        <TableRow key={plan._id}>
                          <TableCell><strong>{plan.name}</strong></TableCell>
                          <TableCell>{plan.price_amount?.toLocaleString()} {plan.currency}/{plan.billing_interval}</TableCell>
                          <TableCell>{(plan.included_usage as any)?.api_calls_per_day || 'Unlimited'}</TableCell>
                          <TableCell>{(plan.allowed_scopes || []).slice(0, 3).join(', ')}{(plan.allowed_scopes || []).length > 3 ? '...' : ''}</TableCell>
                          <TableCell>
                            {plan.price_amount === 0 ? (
                              <Chip label="Free" size="small" />
                            ) : currentSub?.plan_id === plan._id ? (
                              <Chip label="Active" color="success" size="small" />
                            ) : (
                              <Button size="small" variant="outlined" onClick={async () => {
                                try {
                                  await axiosInstance.post('/api/v1/billing/subscriptions', { plan_id: plan._id }, { withCredentials: true })
                                  toast.success(`Subscribed to ${plan.name}`)
                                  const pu = await axiosInstance.get('/api/v1/billing/usage', { withCredentials: true }).then((r) => r.data)
                                  setCurrentPlan(pu.plan)
                                  setCurrentSub(pu.subscription)
                                  setBillingUsage(pu.usage)
                                } catch {
 toast.error('Subscription failed') 
}
                              }}>Subscribe</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>

              <Paper className="api-docs-card">
                <h2>API Scopes</h2>
                <p>Available scopes for your API keys:</p>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {AVAILABLE_SCOPES.map((s) => <Chip key={s} label={s} size="small" variant="outlined" />)}
                </Stack>
              </Paper>
            </>
          )}
        </section>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Key Name" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} fullWidth />
              <Select multiple value={newKeyScopes} onChange={(e) => setNewKeyScopes(e.target.value as string[])} fullWidth>
                {AVAILABLE_SCOPES.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
              {newKeySecret && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <strong>Secret (copy now, won&apos;t be shown again):</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <code style={{ wordBreak: 'break-all', flex: 1 }}>{newKeySecret}</code>
                    <Button size="small" startIcon={<CopyIcon />} onClick={() => {
 navigator.clipboard.writeText(newKeySecret); toast.success('Copied') 
}}>
                      Copy
                    </Button>
                  </div>
                </Paper>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateKey} disabled={!newKeyName.trim()}>Create</Button>
          </DialogActions>
        </Dialog>
      </main>
    </Layout>
  )
}

export default ActivationApi

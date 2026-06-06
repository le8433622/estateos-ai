import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Paper, Chip, Stack, TextField, MenuItem, Typography } from '@mui/material'
import { toast } from 'react-toastify'
import Layout from '@/components/Layout'
import axiosInstance from '@/services/axiosInstance'

import '@/assets/css/api-docs.css'

const PARTNER_TYPES = [
  { value: 'real_estate_app', label: 'Real Estate App' },
  { value: 'agency', label: 'Agency' },
  { value: 'bank', label: 'Bank' },
  { value: 'valuation_company', label: 'Valuation Company' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'ai_app', label: 'AI App' },
  { value: 'market_research', label: 'Market Research' },
  { value: 'enterprise_data_buyer', label: 'Enterprise Data Buyer' },
]

const PartnersDashboard = () => {
  const navigate = useNavigate()
  const [application, setApplication] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [sandboxSecret, setSandboxSecret] = useState('')
  const [formData, setFormData] = useState({
    organization_name: '', contact_name: '', email: '', phone: '',
    partner_type: '', intended_use_case: '', requested_data_products: '',
    requested_locations: '', expected_monthly_usage: 0, current_system_or_app: '',
  })

  useEffect(() => {
    axiosInstance.get('/api/v1/partners/application', { withCredentials: true })
      .then((r) => setApplication(r.data))
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!formData.organization_name || !formData.contact_name || !formData.email || !formData.partner_type || !formData.intended_use_case) {
      toast.error('Required fields: organization, contact name, email, partner type, use case')
      return
    }
    try {
      const res = await axiosInstance.post('/api/v1/partners/apply', {
        ...formData,
        requested_data_products: formData.requested_data_products.split(',').map((s) => s.trim()).filter(Boolean),
        requested_locations: formData.requested_locations.split(',').map((s) => s.trim()).filter(Boolean),
      }, { withCredentials: true })
      setApplication(res.data)
      setShowForm(false)
      toast.success('Application submitted!')
    } catch {
 toast.error('Failed to submit') 
}
  }

  const handleGetSandbox = async () => {
    try {
      const res = await axiosInstance.post('/api/v1/partners/sandbox/credentials', {}, { withCredentials: true })
      setSandboxSecret(res.data.secret || '')
      toast.success(res.data.warning || 'Sandbox credentials ready')
    } catch {
 toast.error('Failed to get sandbox credentials') 
}
  }

  const statusColor = (s: string) => {
    const colors: Record<string, string> = { submitted: 'info', under_review: 'warning', approved_for_trial: 'success', approved_for_production: 'success', rejected: 'error' }
    return (colors[s] || 'default') as 'info' | 'warning' | 'success' | 'error' | 'default'
  }

  return (
    <Layout strict>
      <main className="api-docs">
        <section className="api-docs-hero">
          <p>EstateOS Network</p>
          <h1>Partner Program</h1>
          <span>Access API-grade property data for your apps, research, and workflows.</span>
        </section>

        {!application && !showForm && (
          <Paper sx={{ p: 3, mb: 2, textAlign: 'center' }}>
            <h2>Become a Data Partner</h2>
            <p>Integrate EstateOS structured property data into your application, analysis, or workflow.</p>
            <p>Plans from Free Developer to Enterprise. Sandbox available for approved partners.</p>
            <Button variant="contained" size="large" onClick={() => setShowForm(true)}>Apply Now</Button>
            <Button variant="text" sx={{ ml: 2 }} onClick={() => navigate('/api/data-products')}>View Data Products</Button>
          </Paper>
        )}

        {showForm && (
          <Paper sx={{ p: 3, mb: 2 }}>
            <h2>Partner Application</h2>
            <Stack spacing={2}>
              <TextField label="Organization Name" value={formData.organization_name} onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })} required fullWidth />
              <TextField label="Contact Name" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} required fullWidth />
              <TextField label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required fullWidth />
              <TextField label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} fullWidth />
              <TextField select label="Partner Type" value={formData.partner_type} onChange={(e) => setFormData({ ...formData, partner_type: e.target.value })} required fullWidth>
                {PARTNER_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
              <TextField label="Intended Use Case" value={formData.intended_use_case} onChange={(e) => setFormData({ ...formData, intended_use_case: e.target.value })} multiline minRows={2} required fullWidth />
              <TextField label="Requested Data Products (comma-separated)" value={formData.requested_data_products} onChange={(e) => setFormData({ ...formData, requested_data_products: e.target.value })} fullWidth helperText="e.g. api_grade_property_feed, verified_location_feed" />
              <TextField label="Requested Locations (comma-separated)" value={formData.requested_locations} onChange={(e) => setFormData({ ...formData, requested_locations: e.target.value })} fullWidth />
              <TextField label="Expected Monthly API Calls" type="number" value={formData.expected_monthly_usage} onChange={(e) => setFormData({ ...formData, expected_monthly_usage: Number(e.target.value) })} fullWidth />
              <TextField label="Current System or App" value={formData.current_system_or_app} onChange={(e) => setFormData({ ...formData, current_system_or_app: e.target.value })} fullWidth />
              <Typography variant="caption">By submitting, you acknowledge EstateOS data visibility and privacy rules. Sensitive data is not publicly exposed.</Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={handleSubmit}>Submit Application</Button>
                <Button variant="text" onClick={() => setShowForm(false)}>Cancel</Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {application && (
          <>
            <Paper sx={{ p: 3, mb: 2 }}>
              <h2>Your Application</h2>
              <p><strong>Organization:</strong> {application.organization_name}</p>
              <p><strong>Contact:</strong> {application.contact_name} ({application.email})</p>
              <p><strong>Type:</strong> {application.partner_type}</p>
              <p><strong>Use Case:</strong> {application.intended_use_case}</p>
              <p><strong>Status:</strong> <Chip label={application.status} color={statusColor(application.status)} /></p>
              {application.review_notes && <p><strong>Review Notes:</strong> {application.review_notes}</p>}
              {application.approved_plan && <p><strong>Approved Plan:</strong> {application.approved_plan}</p>}
            </Paper>

            {['approved_for_trial', 'approved_for_production'].includes(application.status) && (
              <Paper sx={{ p: 3, mb: 2 }}>
                <h2>Sandbox Access</h2>
                <p>Your application is approved. Generate sandbox credentials to start testing.</p>
                <Button variant="contained" onClick={handleGetSandbox}>Generate Sandbox Key</Button>
                {sandboxSecret && (
                  <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: '#fffbe6' }}>
                    <p><strong>Sandbox API Key Secret (show once):</strong></p>
                    <code style={{ wordBreak: 'break-all' }}>{sandboxSecret}</code>
                    <p><em>This key works only with sandbox (redacted) data and expires in 30 days.</em></p>
                  </Paper>
                )}
              </Paper>
            )}

            <Paper sx={{ p: 3 }}>
              <h2>Agreements</h2>
              <Button variant="outlined" sx={{ mr: 1 }} onClick={async () => {
                try {
                  await axiosInstance.post('/api/v1/partners/agreements', { agreement_type: 'api_terms', version: 'v1' }, { withCredentials: true })
                  toast.success('API terms accepted')
                } catch {
 toast.error('Failed to accept') 
}
              }}>Accept API Terms</Button>
              <Button variant="outlined" sx={{ mr: 1 }} onClick={async () => {
                try {
                  await axiosInstance.post('/api/v1/partners/agreements', { agreement_type: 'data_visibility_terms', version: 'v1' }, { withCredentials: true })
                  toast.success('Data visibility terms accepted')
                } catch {
 toast.error('Failed to accept') 
}
              }}>Accept Data Visibility Terms</Button>
              <Button variant="outlined" onClick={async () => {
                try {
                  await axiosInstance.post('/api/v1/partners/agreements', { agreement_type: 'privacy_terms', version: 'v1' }, { withCredentials: true })
                  toast.success('Privacy terms accepted')
                } catch {
 toast.error('Failed to accept') 
}
              }}>Accept Privacy Terms</Button>
            </Paper>
          </>
        )}
      </main>
    </Layout>
  )
}

export default PartnersDashboard
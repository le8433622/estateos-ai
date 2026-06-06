import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Paper, TextField, MenuItem, Stack } from '@mui/material'
import { toast } from 'react-toastify'
import Layout from '@/components/Layout'
import axiosInstance from '@/services/axiosInstance'

const EVIDENCE_TYPES = [
  { value: 'photo', label: 'Photo' },
  { value: 'video', label: 'Video' },
  { value: 'location_pin', label: 'Location Pin' },
  { value: 'redacted_legal_doc', label: 'Redacted Legal Document' },
  { value: 'owner_confirmation', label: 'Owner Confirmation' },
  { value: 'contact_proof', label: 'Contact Proof' },
  { value: 'availability_proof', label: 'Availability Proof' },
  { value: 'field_check_photo', label: 'Field Check Photo' },
]

const ActivationSupplyEvidenceNew = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [evidenceType, setEvidenceType] = useState('photo')
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!summary) {
      toast.error('Summary is required')
      return
    }
    setSubmitting(true)
    try {
      await axiosInstance.post(`/api/v1/supply/properties/${id}/evidence`, {
        evidence_type: evidenceType,
        visibility: 'private',
        redaction_state: 'restricted',
        summary,
      }, { withCredentials: true })
      toast.success('Evidence attached')
      navigate(`/supply/${id}`)
    } catch {
      toast.error('Failed to attach evidence')
    }
    setSubmitting(false)
  }

  return (
    <Layout strict>
      <main className="api-docs" style={{ maxWidth: 640, margin: '0 auto' }}>
        <section className="api-docs-hero">
          <p>EstateOS Network</p>
          <h1>Attach Evidence</h1>
          <span>Evidence is stored privately by default. Only summary metadata is visible in public context.</span>
        </section>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField select label="Evidence Type" value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)} fullWidth>
              {EVIDENCE_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField label="Summary (public)" value={summary} onChange={(e) => setSummary(e.target.value)} multiline minRows={2} fullWidth
              helperText="This summary will be visible in trust state. Raw evidence file stays private." />
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Attaching...' : 'Attach Evidence'}
            </Button>
            <Button variant="text" onClick={() => navigate(`/supply/${id}`)}>Cancel</Button>
          </Stack>
        </Paper>
      </main>
    </Layout>
  )
}

export default ActivationSupplyEvidenceNew

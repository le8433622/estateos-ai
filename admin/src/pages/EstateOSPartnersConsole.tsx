import React, { useEffect, useState } from 'react'
import { Button, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Stack, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem } from '@mui/material'
import Layout from '@/components/Layout'
import * as helper from '@/utils/helper'
import axiosInstance from '@/services/axiosInstance'

import '@/assets/css/estateos-command-center.css'

const TABS = [
  { key: 'pipeline', label: 'Sales Pipeline' },
  { key: 'applications', label: 'Applications' },
  { key: 'agreements', label: 'Agreements' },
]

const EstateOSPartnersConsole = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].key)
  const [pipeline, setPipeline] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [agreements, setAgreements] = useState<any[]>([])
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [statusDialog, setStatusDialog] = useState<{ id: string; status: string; notes: string; plan: string } | null>(null)

  const loadPipeline = async () => {
    try {
      const res = await axiosInstance.get('/api/v1/partners/admin/sales-pipeline', { withCredentials: true })
      setPipeline(res.data)
    } catch (err) {
 helper.error(err, 'Could not load pipeline') 
}
  }

  const loadApplications = async (status?: string) => {
    try {
      const url = `/api/v1/partners/admin/applications${status ? `?status=${encodeURIComponent(status)}` : ''}`
      const res = await axiosInstance.get(url, { withCredentials: true })
      setApplications(res.data.rows || [])
    } catch (err) {
 helper.error(err, 'Could not load applications') 
}
  }

  const loadAgreements = async () => {
    try {
      const res = await axiosInstance.get('/api/v1/partners/admin/agreements', { withCredentials: true })
      setAgreements(res.data.rows || [])
    } catch (err) {
 helper.error(err, 'Could not load agreements') 
}
  }

  useEffect(() => {
    if (activeTab === 'pipeline') {
loadPipeline()
} else if (activeTab === 'applications') {
loadApplications()
} else if (activeTab === 'agreements') {
loadAgreements()
}
  }, [activeTab])

  const handleViewDetail = async (id: string) => {
    try {
      const res = await axiosInstance.get(`/api/v1/partners/admin/applications/${encodeURIComponent(id)}`, { withCredentials: true })
      setSelectedApp(res.data)
    } catch (err) {
 helper.error(err, 'Could not load detail') 
}
  }

  const handleUpdateStatus = async () => {
    if (!statusDialog) {
return
}
    try {
      await axiosInstance.patch(`/api/v1/partners/admin/applications/${encodeURIComponent(statusDialog.id)}/status`, {
        status: statusDialog.status, review_notes: statusDialog.notes, approved_plan: statusDialog.plan,
      }, { withCredentials: true })
      setStatusDialog(null)
      setSelectedApp(null)
      loadApplications()
      loadPipeline()
    } catch {
 helper.error('Status update failed') 
}
  }

  const statusColor = (s: string) => {
    const colors: Record<string, string> = { submitted: 'info', under_review: 'warning', approved_for_trial: 'success', approved_for_production: 'success', rejected: 'error', suspended: 'default' }
    return (colors[s] || 'default') as any
  }

  return (
    <Layout strict>
      <div className="estateos-cc">
        <div className="estateos-cc-header">
          <h1>EstateOS Partners Console</h1>
          <span>Partner applications, sales pipeline, onboarding, sandbox access</span>
        </div>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {TABS.map((tab) => (
            <Button key={tab.key} variant={activeTab === tab.key ? 'contained' : 'text'} onClick={() => {
 setActiveTab(tab.key); setSelectedApp(null) 
}} size="small">{tab.label}</Button>
          ))}
        </Stack>

        {activeTab === 'pipeline' && pipeline && (
          <>
            <section className="estateos-cc-panels">
              <Paper className="estateos-cc-panel"><h3>Total</h3><span className="estateos-cc-count">{pipeline.counts?.total}</span></Paper>
              <Paper className="estateos-cc-panel"><h3>Submitted</h3><span className="estateos-cc-count">{pipeline.counts?.submitted}</span></Paper>
              <Paper className="estateos-cc-panel"><h3>Under Review</h3><span className="estateos-cc-count">{pipeline.counts?.underReview}</span></Paper>
              <Paper className="estateos-cc-panel"><h3>Trial</h3><span className="estateos-cc-count">{pipeline.counts?.trial}</span></Paper>
              <Paper className="estateos-cc-panel"><h3>Production</h3><span className="estateos-cc-count">{pipeline.counts?.production}</span></Paper>
              <Paper className="estateos-cc-panel"><h3>Rejected</h3><span className="estateos-cc-count">{pipeline.counts?.rejected}</span></Paper>
            </section>
            <Paper sx={{ p: 2, mt: 2 }}>
              <h3>By Partner Type</h3>
              <Table size="small">
                <TableBody>
                  {(pipeline.by_type || []).map((t: any) => (
                    <TableRow key={t._id}><TableCell>{t._id}</TableCell><TableCell>{t.count}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            <Paper sx={{ p: 2, mt: 2 }}>
              <h3>Most Requested Data Products</h3>
              <Table size="small">
                <TableBody>
                  {(pipeline.most_requested_products || []).map((p: any, i: number) => (
                    <TableRow key={i}><TableCell>{p._id || '(not specified)'}</TableCell><TableCell>{p.count}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}

        {activeTab === 'applications' && !selectedApp && (
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {['submitted', 'under_review', 'approved_for_trial', 'approved_for_production', 'rejected'].map((s) => (
                <Button key={s} size="small" variant="outlined" onClick={() => loadApplications(s)}>{s}</Button>
              ))}
              <Button size="small" onClick={() => loadApplications()}>All</Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Org</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Use Case</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((a: any) => (
                  <TableRow key={a._id}>
                    <TableCell>{a.organization_name}</TableCell>
                    <TableCell>{a.contact_name}<br /><small>{a.email}</small></TableCell>
                    <TableCell><Chip label={a.partner_type} size="small" /></TableCell>
                    <TableCell><Chip label={a.status} size="small" color={statusColor(a.status)} /></TableCell>
                    <TableCell>{a.intended_use_case?.slice(0, 60)}</TableCell>
                    <TableCell>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleViewDetail(a._id)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {selectedApp && activeTab === 'applications' && (
          <Paper sx={{ p: 2 }}>
            <Button size="small" onClick={() => setSelectedApp(null)} sx={{ mb: 2 }}>Back</Button>
            <h3>{selectedApp.application?.organization_name}</h3>
            <p><strong>Contact:</strong> {selectedApp.application?.contact_name} — {selectedApp.application?.email}</p>
            <p><strong>Type:</strong> {selectedApp.application?.partner_type}</p>
            <p><strong>Status:</strong> <Chip label={selectedApp.application?.status} color={statusColor(selectedApp.application?.status)} /></p>
            <p><strong>Use Case:</strong> {selectedApp.application?.intended_use_case}</p>
            <p><strong>Data Products:</strong> {(selectedApp.application?.requested_data_products || []).join(', ')}</p>
            <p><strong>Locations:</strong> {(selectedApp.application?.requested_locations || []).join(', ') || 'Any'}</p>
            <p><strong>Expected Usage:</strong> {selectedApp.application?.expected_monthly_usage?.toLocaleString()} calls/month</p>
            <p><strong>Current System:</strong> {selectedApp.application?.current_system_or_app || 'N/A'}</p>
            <p><strong>Review Notes:</strong> {selectedApp.application?.review_notes || '—'}</p>
            <p><strong>Approved Plan:</strong> {selectedApp.application?.approved_plan || '—'}</p>

            <h4>Agreements</h4>
            {(selectedApp.agreements || []).length === 0 ? <p>No agreements yet.</p> : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Accepted At</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedApp.agreements.map((ag: any) => (
                    <TableRow key={ag._id}>
                      <TableCell>{ag.agreement_type}</TableCell>
                      <TableCell>{ag.version}</TableCell>
                      <TableCell>{ag.accepted_at ? new Date(ag.accepted_at).toLocaleString() : ''}</TableCell>
                      <TableCell>{ag.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button variant="contained" color="success" onClick={() => setStatusDialog({
                id: selectedApp.application._id, status: 'approved_for_trial', notes: '', plan: '',
              })}>Approve Trial</Button>
              <Button variant="contained" onClick={() => setStatusDialog({
                id: selectedApp.application._id, status: 'approved_for_production', notes: '', plan: '',
              })}>Approve Production</Button>
              <Button variant="outlined" color="error" onClick={() => setStatusDialog({
                id: selectedApp.application._id, status: 'rejected', notes: '', plan: '',
              })}>Reject</Button>
            </Stack>
          </Paper>
        )}

        {activeTab === 'agreements' && (
          <Paper sx={{ p: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Application</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Accepted</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agreements.map((ag: any) => (
                  <TableRow key={ag._id}>
                    <TableCell>{ag.partner_application_id?.toString().slice(-6)}</TableCell>
                    <TableCell>{ag.agreement_type}</TableCell>
                    <TableCell>{ag.version}</TableCell>
                    <TableCell>{ag.accepted_at ? new Date(ag.accepted_at).toLocaleString() : ''}</TableCell>
                    <TableCell><Chip label={ag.status} size="small" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Application Status</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="New Status" value={statusDialog?.status || ''} onChange={(e) => setStatusDialog((prev) => prev ? { ...prev, status: e.target.value } : null)} fullWidth>
                <MenuItem value="approved_for_trial">Approve for Trial</MenuItem>
                <MenuItem value="approved_for_production">Approve for Production</MenuItem>
                <MenuItem value="rejected">Reject</MenuItem>
                <MenuItem value="under_review">Mark Under Review</MenuItem>
                <MenuItem value="suspended">Suspend</MenuItem>
              </TextField>
              <TextField label="Review Notes" value={statusDialog?.notes || ''} onChange={(e) => setStatusDialog((prev) => prev ? { ...prev, notes: e.target.value } : null)} multiline minRows={2} fullWidth />
              <TextField label="Approved Plan" value={statusDialog?.plan || ''} onChange={(e) => setStatusDialog((prev) => prev ? { ...prev, plan: e.target.value } : null)} fullWidth helperText="e.g. pro_5m_month, agency_data_10_30m_month" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialog(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateStatus}>Update</Button>
          </DialogActions>
        </Dialog>
      </div>
    </Layout>
  )
}

export default EstateOSPartnersConsole
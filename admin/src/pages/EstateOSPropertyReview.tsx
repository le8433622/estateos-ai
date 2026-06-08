import React, { useEffect, useState } from 'react'
import { Button, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Stack, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, IconButton } from '@mui/material'
import { Visibility } from '@mui/icons-material'
import { toast } from 'react-toastify'
import Layout from '@/components/Layout'
import * as helper from '@/utils/helper'
import axiosInstance from '@/services/axiosInstance'

import '@/assets/css/estateos-command-center.css'

const TABS = [
  { key: 'claims', label: 'Claims' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'invoices', label: 'Verification Invoices' },
]

const CLAIM_COLORS: Record<string, string> = {
  self_declared: 'default',
  evidence_attached: 'info',
  verification_requested: 'warning',
  operator_checked: 'success',
  rejected: 'error',
  archived: 'default',
}

const INVOICE_COLORS: Record<string, string> = {
  issued: 'warning',
  paid: 'success',
  cancelled: 'error',
  refunded: 'default',
}

const EstateOSPropertyReview = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].key)
  const [claims, setClaims] = useState<any[]>([])
  const [evidence, setEvidence] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [statusDialog, setStatusDialog] = useState<{ id: string; status: string; notes: string } | null>(null)
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null)

  const loadClaims = async () => {
    try {
      const res = await axiosInstance.get('/api/v1/ops/property-claims', { withCredentials: true })
      setClaims(res.data.rows || [])
    } catch (err) {
      helper.error(err, 'Could not load claims')
    }
  }

  const loadEvidence = async () => {
    try {
      const res = await axiosInstance.get('/api/v1/ops/property-evidence', { withCredentials: true })
      setEvidence(res.data.rows || [])
    } catch (err) {
      helper.error(err, 'Could not load evidence')
    }
  }

  const loadInvoices = async () => {
    try {
      const res = await axiosInstance.get('/api/v1/billing/admin/invoices', { withCredentials: true })
      setInvoices((res.data.rows || []).filter((inv: any) => inv.verification_package_type))
    } catch (err) {
      helper.error(err, 'Could not load invoices')
    }
  }

  useEffect(() => {
    if (activeTab === 'claims') {
 loadClaims() 
} else if (activeTab === 'evidence') {
 loadEvidence() 
} else if (activeTab === 'invoices') {
 loadInvoices() 
}
  }, [activeTab])

  const handleMarkPaid = async (id: string) => {
    try {
      await axiosInstance.patch(`/api/v1/billing/admin/invoices/${encodeURIComponent(id)}/status`, { status: 'paid', notes: 'Marked paid by operator' }, { withCredentials: true })
      toast.success('Invoice marked paid')
      loadInvoices()
    } catch (err) {
      helper.error(err, 'Could not update invoice')
    }
  }

  const handleUpdateStatus = async () => {
    if (!statusDialog) {
      return
    }
    try {
      await axiosInstance.patch(`/api/v1/billing/admin/invoices/${encodeURIComponent(statusDialog.id)}/status`, { status: statusDialog.status, notes: statusDialog.notes }, { withCredentials: true })
      setStatusDialog(null)
      loadInvoices()
    } catch {
      helper.error('Status update failed')
    }
  }

  const renderValue = (v: any) => {
    if (v === null || v === undefined) {
      return '\u2014'
    }
    if (typeof v === 'object') {
      return JSON.stringify(v).slice(0, 100)
    }
    return String(v)
  }

  return (
    <Layout strict>
      <div className="estateos-cc">
        <div className="estateos-cc-header">
          <h1>Property Review</h1>
          <span>Review property claims, evidence, and verification package invoices</span>
        </div>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {TABS.map((tab) => (
            <Button key={tab.key} variant={activeTab === tab.key ? 'contained' : 'text'} onClick={() => setActiveTab(tab.key)} size="small">
              {tab.label}
            </Button>
          ))}
        </Stack>

        {activeTab === 'claims' && (
          <Paper sx={{ p: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Property ID</TableCell>
                  <TableCell>Source Account</TableCell>
                  <TableCell>Claim State</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {claims.length === 0 ? (
                  <TableRow><TableCell colSpan={6}>No claims found.</TableCell></TableRow>
                ) : claims.map((c: any) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.property_id?.toString().slice(-8)}</TableCell>
                    <TableCell>{c.source_account_id?.toString().slice(-8)}</TableCell>
                    <TableCell><Chip label={c.claim_state} size="small" color={(CLAIM_COLORS[c.claim_state] || 'default') as any} /></TableCell>
                    <TableCell>{c.confidence_level ?? '—'}%</TableCell>
                    <TableCell>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {activeTab === 'evidence' && !selectedEvidence && (
          <Paper sx={{ p: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Property</TableCell>
                  <TableCell>Visibility</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Summary</TableCell>
                  <TableCell>Attached</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {evidence.length === 0 ? (
                  <TableRow><TableCell colSpan={7}>No evidence found.</TableCell></TableRow>
                ) : evidence.map((ev: any) => (
                  <TableRow key={ev._id}>
                    <TableCell><Chip label={ev.evidence_type} size="small" /></TableCell>
                    <TableCell>{ev.property_id?.toString().slice(-8)}</TableCell>
                    <TableCell><Chip label={ev.visibility} size="small" variant="outlined" /></TableCell>
                    <TableCell><Chip label={ev.review_status || ev.status} size="small" /></TableCell>
                    <TableCell>{ev.summary?.slice(0, 60) || '—'}</TableCell>
                    <TableCell>{ev.createdAt ? new Date(ev.createdAt).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => setSelectedEvidence(ev)}><Visibility /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {selectedEvidence && activeTab === 'evidence' && (
          <Paper sx={{ p: 2 }}>
            <Button size="small" onClick={() => setSelectedEvidence(null)} sx={{ mb: 2 }}>Back</Button>
            <h3>Evidence Detail</h3>
            {Object.entries(selectedEvidence).map(([key, val]) => (
              <p key={key}><strong>{key}:</strong> {renderValue(val)}</p>
            ))}
          </Paper>
        )}

        {activeTab === 'invoices' && (
          <Paper sx={{ p: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Package Type</TableCell>
                  <TableCell>Property</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={7}>No verification invoices found.</TableCell></TableRow>
                ) : invoices.map((inv: any) => (
                  <TableRow key={inv._id}>
                    <TableCell>{inv.invoice_number || inv._id.toString().slice(-8)}</TableCell>
                    <TableCell><Chip label={inv.verification_package_type} size="small" /></TableCell>
                    <TableCell>{inv.property_id?.toString().slice(-8) || '—'}</TableCell>
                    <TableCell>{inv.amount?.toLocaleString()} {inv.currency}</TableCell>
                    <TableCell><Chip label={inv.status} size="small" color={(INVOICE_COLORS[inv.status] || 'default') as any} /></TableCell>
                    <TableCell>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {inv.status === 'issued' && (
                          <Button size="small" variant="contained" color="success" onClick={() => handleMarkPaid(inv._id)}>Mark Paid</Button>
                        )}
                        <Button size="small" variant="outlined" onClick={() => setStatusDialog({ id: inv._id, status: inv.status, notes: '' })}>Update</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Invoice Status</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="New Status" value={statusDialog?.status || ''} onChange={(e) => setStatusDialog((prev) => prev ? { ...prev, status: e.target.value } : null)} fullWidth>
                <MenuItem value="issued">Issued</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </TextField>
              <TextField label="Notes" value={statusDialog?.notes || ''} onChange={(e) => setStatusDialog((prev) => prev ? { ...prev, notes: e.target.value } : null)} multiline minRows={2} fullWidth />
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

export default EstateOSPropertyReview

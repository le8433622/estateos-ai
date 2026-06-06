import React, { useEffect, useState } from 'react'
import { Button, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material'
import { toast } from 'react-toastify'
import Layout from '@/components/Layout'
import * as helper from '@/utils/helper'
import * as BillingService from '@/services/BillingService'

import '@/assets/css/estateos-command-center.css'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'subscriptions', label: 'Subscriptions' },
  { key: 'payments', label: 'Payments' },
  { key: 'plans', label: 'Plans' },
]

const EstateOSBillingConsole = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].key)
  const [overview, setOverview] = useState<Record<string, number>>({})
  const [invoices, setInvoices] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [issueOpen, setIssueOpen] = useState(false)
  const [issueData, setIssueData] = useState({ account_id: '', amount: 0, description: '', verification_package_type: '' })
  const [markPaidOpen, setMarkPaidOpen] = useState<string | null>(null)

  const loadAll = async () => {
    try {
      const [overviewData, invoiceData, subData, paymentData, planData] = await Promise.all([
        BillingService.getBillingOverview(),
        BillingService.listInvoices(),
        BillingService.listSubscriptions(),
        BillingService.listPaymentRecords(),
        BillingService.listPlans(),
      ])
      setOverview(overviewData.counts || {})
      setInvoices(invoiceData.rows || [])
      setSubscriptions(subData.rows || [])
      setPayments(paymentData.rows || [])
      setPlans(planData.rows || [])
    } catch (err) {
      helper.error(err, 'Could not load billing data')
    }
    }

  useEffect(() => {
    loadAll()
  }, [])

  const handleIssueInvoice = async () => {
    if (!issueData.account_id || !issueData.amount) {
      toast.error('Account ID and amount are required')
      return
    }
    try {
      await BillingService.issueInvoice(issueData)
      toast.success('Invoice issued')
      setIssueOpen(false)
      setIssueData({ account_id: '', amount: 0, description: '', verification_package_type: '' })
      await loadAll()
    } catch {
      toast.error('Failed to issue invoice')
    }
  }

  const handleMarkPaid = async () => {
    if (!markPaidOpen) {
 return 
}
    try {
      await BillingService.updateInvoiceStatus(markPaidOpen, 'paid')
      toast.success('Invoice marked as paid')
      setMarkPaidOpen(null)
      await loadAll()
    } catch {
      toast.error('Failed to update invoice')
    }
  }

  const statusColor = (status: string) => {
    const colors: Record<string, string> = { paid: 'success', issued: 'warning', pending_payment: 'info', cancelled: 'default', overdue: 'error', refunded: 'secondary' }
    return (colors[status] || 'default') as 'success' | 'warning' | 'info' | 'default' | 'error' | 'secondary'
  }

  return (
    <Layout strict>
      <div className="estateos-cc">
        <div className="estateos-cc-header">
          <h1>EstateOS Billing Console</h1>
          <span>Billing, plans, invoices, subscriptions, verification packages</span>
        </div>

        <div className="estateos-cc-tabs">
          {TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'contained' : 'text'}
              onClick={() => setActiveTab(tab.key)}
              sx={{ mr: 1 }}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <section className="estateos-cc-panels">
            {Object.entries(overview).map(([key, value]) => (
              <Paper className="estateos-cc-panel" key={key}>
                <h3>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</h3>
                <span className="estateos-cc-count">{value}</span>
              </Paper>
            ))}
          </section>
        )}

        {activeTab === 'invoices' && (
          <Paper className="estateos-cc-panel" sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button variant="contained" onClick={() => setIssueOpen(true)}>Issue Invoice</Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Package</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv: any) => (
                  <TableRow key={inv._id}>
                    <TableCell><code>{inv.invoice_number}</code></TableCell>
                    <TableCell>{inv.account_id?.toString().slice(-6)}</TableCell>
                    <TableCell>{inv.amount?.toLocaleString()} {inv.currency}</TableCell>
                    <TableCell><Chip label={inv.status} size="small" color={statusColor(inv.status)} /></TableCell>
                    <TableCell>{inv.verification_package_type || '—'}</TableCell>
                    <TableCell>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : ''}</TableCell>
                    <TableCell>
                      {['issued', 'pending_payment'].includes(inv.status) && (
                        <Button size="small" onClick={() => setMarkPaidOpen(inv._id)}>Mark Paid</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {activeTab === 'subscriptions' && (
          <Paper className="estateos-cc-panel" sx={{ p: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Account</TableCell>
                  <TableCell>Plan ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptions.map((sub: any) => (
                  <TableRow key={sub._id}>
                    <TableCell>{sub.account_id?.toString().slice(-6)}</TableCell>
                    <TableCell>{sub.plan_id?.toString().slice(-6)}</TableCell>
                    <TableCell><Chip label={sub.status} size="small" color={sub.status === 'active' ? 'success' : 'default'} /></TableCell>
                    <TableCell>{sub.start_date ? new Date(sub.start_date).toLocaleDateString() : ''}</TableCell>
                    <TableCell>{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {activeTab === 'payments' && (
          <Paper className="estateos-cc-panel" sx={{ p: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Account</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Ref</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((pmt: any) => (
                  <TableRow key={pmt._id}>
                    <TableCell>{pmt.account_id?.toString().slice(-6)}</TableCell>
                    <TableCell>{pmt.amount?.toLocaleString()} {pmt.currency}</TableCell>
                    <TableCell><Chip label={pmt.status} size="small" /></TableCell>
                    <TableCell>{pmt.provider}</TableCell>
                    <TableCell>{pmt.provider_ref || '—'}</TableCell>
                    <TableCell>{pmt.createdAt ? new Date(pmt.createdAt).toLocaleDateString() : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {activeTab === 'plans' && (
          <Paper className="estateos-cc-panel" sx={{ p: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Interval</TableCell>
                  <TableCell>Scopes</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.map((plan: any) => (
                  <TableRow key={plan._id}>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{plan.plan_type}</TableCell>
                    <TableCell>{plan.price_amount?.toLocaleString()} {plan.currency}</TableCell>
                    <TableCell>{plan.billing_interval}</TableCell>
                    <TableCell>{(plan.allowed_scopes || []).join(', ')}</TableCell>
                    <TableCell><Chip label={plan.status} size="small" color={plan.status === 'active' ? 'success' : 'default'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </div>

      <Dialog open={issueOpen} onClose={() => setIssueOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Invoice</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Account ID" value={issueData.account_id} onChange={(e) => setIssueData({ ...issueData, account_id: e.target.value })} fullWidth />
            <TextField label="Amount (VND)" type="number" value={issueData.amount} onChange={(e) => setIssueData({ ...issueData, amount: Number(e.target.value) })} fullWidth />
            <TextField label="Description" value={issueData.description} onChange={(e) => setIssueData({ ...issueData, description: e.target.value })} fullWidth multiline minRows={2} />
            <TextField label="Verification Package Type (optional)" value={issueData.verification_package_type} onChange={(e) => setIssueData({ ...issueData, verification_package_type: e.target.value })} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleIssueInvoice}>Issue</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!markPaidOpen} onClose={() => setMarkPaidOpen(null)}>
        <DialogTitle>Mark Invoice as Paid</DialogTitle>
        <DialogContent>Mark this invoice as paid? This may trigger a verification job if linked to a package.</DialogContent>
        <DialogActions>
          <Button onClick={() => setMarkPaidOpen(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleMarkPaid}>Mark Paid</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default EstateOSBillingConsole
import React, { useEffect, useState } from 'react'
import { Button, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Stack } from '@mui/material'
import Layout from '@/components/Layout'
import * as helper from '@/utils/helper'
import * as DistributionService from '@/services/DistributionService'

import '@/assets/css/estateos-command-center.css'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Data Products' },
  { key: 'webhooks', label: 'Webhooks' },
]

const EstateOSDistributionConsole = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].key)
  const [analytics, setAnalytics] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [preview, setPreview] = useState<any>(null)
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        if (activeTab === 'overview') {
          const data = await DistributionService.getDistributionAnalytics()
          setAnalytics(data)
        } else if (activeTab === 'products') {
          const data = await DistributionService.listDataProducts()
          setProducts(data.rows || [])
        } else if (activeTab === 'webhooks') {
          const [wh, dl] = await Promise.all([
            DistributionService.adminListWebhooks(),
            DistributionService.adminListDeliveries(),
          ])
          setWebhooks(wh.rows || [])
          setDeliveries(dl.rows || [])
        }
      } catch (err) {
        helper.error(err, 'Could not load distribution data')
      }
    }
    load()
  }, [activeTab])

  const handlePreview = async (type: string) => {
    try {
      const data = await DistributionService.previewDataProduct(type)
      setPreview(data)
    } catch (err) {
      helper.error(err, 'Could not load preview')
    }
  }

  return (
    <Layout strict>
      <div className="estateos-cc">
        <div className="estateos-cc-header">
          <h1>EstateOS Distribution Console</h1>
          <span>Data products, partner feeds, webhooks, distribution analytics</span>
        </div>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {TABS.map((tab) => (
            <Button key={tab.key} variant={activeTab === tab.key ? 'contained' : 'text'} onClick={() => {
 setActiveTab(tab.key); setPreview(null) 
}} size="small">{tab.label}</Button>
          ))}
        </Stack>

        {activeTab === 'overview' && analytics && (
          <>
            <section className="estateos-cc-panels">
              <Paper className="estateos-cc-panel"><h3>API-Grade Properties</h3><span className="estateos-cc-count">{analytics.total_api_grade}</span></Paper>
              <Paper className="estateos-cc-panel"><h3>Verified Location</h3><span className="estateos-cc-count">{analytics.total_verified_location}</span></Paper>
              <Paper className="estateos-cc-panel"><h3>Fresh Inventory</h3><span className="estateos-cc-count">{analytics.total_fresh_inventory}</span></Paper>
              <Paper className="estateos-cc-panel"><h3>Duplicate Filtered</h3><span className="estateos-cc-count">{analytics.total_duplicate_filtered}</span></Paper>
              <Paper className="estateos-cc-panel"><h3>Active Webhooks</h3><span className="estateos-cc-count">{analytics.active_webhooks}</span></Paper>
              <Paper className="estateos-cc-panel"><h3>Delivery Success</h3><span className="estateos-cc-count">{analytics.delivery_success_rate}%</span></Paper>
            </section>

            <Paper sx={{ p: 2, mt: 2 }}>
              <h3>By Area</h3>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Area</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>API-Grade</TableCell>
                    <TableCell>Verified Location</TableCell>
                    <TableCell>Fresh</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(analytics.by_area || {}).map(([city, data]: [string, any]) => (
                    <TableRow key={city}>
                      <TableCell>{city}</TableCell>
                      <TableCell>{data.total}</TableCell>
                      <TableCell>{data.api_grade}</TableCell>
                      <TableCell>{data.verified_location}</TableCell>
                      <TableCell>{data.fresh}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}

        {activeTab === 'products' && (
          <Paper sx={{ p: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Scopes</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Preview</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((p: any) => (
                  <TableRow key={p.type}>
                    <TableCell><strong>{p.name}</strong><br /><code>{p.type}</code></TableCell>
                    <TableCell>{p.description}</TableCell>
                    <TableCell><Chip label={p.required_plan} size="small" /></TableCell>
                    <TableCell>{(p.required_scopes || []).join(', ')}</TableCell>
                    <TableCell>{p.update_frequency}</TableCell>
                    <TableCell><Button size="small" onClick={() => handlePreview(p.type)}>Preview</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {preview && (
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <h4>Preview: {preview.product_type}</h4>
                <p>Total matching: {preview.total_matching}</p>
                <pre style={{ maxHeight: 300, overflow: 'auto', fontSize: 12 }}>
                  {JSON.stringify(preview.rows?.slice(0, 2), null, 2)}
                </pre>
              </Paper>
            )}
          </Paper>
        )}

        {activeTab === 'webhooks' && (
          <>
            <Paper sx={{ p: 2, mb: 2 }}>
              <h3>Webhook Endpoints ({webhooks.length})</h3>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>URL</TableCell>
                    <TableCell>Events</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Failures</TableCell>
                    <TableCell>Last Triggered</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {webhooks.map((wh: any) => (
                    <TableRow key={wh._id}>
                      <TableCell><code>{wh.url}</code></TableCell>
                      <TableCell>{(wh.events || []).join(', ')}</TableCell>
                      <TableCell><Chip label={wh.status} size="small" color={wh.status === 'active' ? 'success' : 'default'} /></TableCell>
                      <TableCell>{wh.failure_count}</TableCell>
                      <TableCell>{wh.last_triggered_at ? new Date(wh.last_triggered_at).toLocaleString() : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <h3>Delivery Logs ({deliveries.length})</h3>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Status Code</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deliveries.map((dl: any) => (
                    <TableRow key={dl._id}>
                      <TableCell>{dl.event_type}</TableCell>
                      <TableCell><Chip label={dl.status} size="small" color={dl.status === 'success' ? 'success' : 'error'} /></TableCell>
                      <TableCell>{dl.status_code || '—'}</TableCell>
                      <TableCell>{dl.duration_ms ? `${dl.duration_ms}ms` : '—'}</TableCell>
                      <TableCell>{dl.createdAt ? new Date(dl.createdAt).toLocaleString() : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}
      </div>
    </Layout>
  )
}

export default EstateOSDistributionConsole
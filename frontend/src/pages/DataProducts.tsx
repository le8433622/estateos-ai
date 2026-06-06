import React, { useState, useEffect } from 'react'
import { Button, Chip, Paper, Stack } from '@mui/material'
import Layout from '@/components/Layout'
import axiosInstance from '@/services/axiosInstance'

import '@/assets/css/api-docs.css'

const DataProducts = () => {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [preview, setPreview] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get('/api/v1/data-products')
        setProducts(res.data.rows || [])
      } catch {
        // not loaded
      }
    }
    load()
  }, [])

  const loadPreview = async (type: string) => {
    try {
      const res = await axiosInstance.get(`/api/v1/data-products/${encodeURIComponent(type)}/preview`, { withCredentials: true })
      setPreview(res.data)
      setSelectedProduct(products.find((p) => p.type === type) || null)
    } catch {
      setPreview(null)
    }
  }

  return (
    <Layout>
      <main className="api-docs">
        <section className="api-docs-hero">
          <p>EstateOS Network</p>
          <h1>Data Products</h1>
          <span>API-grade property data products packaged by quality, geography, and use case. Partner-safe, auditable, plan-enforced.</span>
        </section>

        <Paper sx={{ p: 3, mb: 3 }}>
          <h2>Trust Labels & Visibility</h2>
          <p>All data products follow EstateOS visibility rules:</p>
          <ul>
            <li>Exact private location is masked in all public/partner feeds.</li>
            <li>Sensitive evidence is never included.</li>
            <li>Legal certainty labels are never provided.</li>
            <li>Fields are shaped by plan scope and field-level visibility.</li>
            <li>Every API call is logged for audit and usage tracking.</li>
          </ul>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {['self_declared', 'evidence_attached', 'verified_photo', 'verified_location', 'verified_contact', 'availability_checked', 'operator_checked', 'authorized_source', 'legal_not_verified'].map((l) => (
              <Chip key={l} label={l} size="small" variant="outlined" />
            ))}
          </Stack>
        </Paper>

        {products.map((p: any) => (
          <Paper key={p.type} sx={{ p: 2, mb: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>{p.name}</h3>
                <code>{p.type}</code>
              </div>
              <div>
                <Chip label={p.required_plan} size="small" color="primary" variant="outlined" sx={{ mr: 1 }} />
                <Chip label={p.update_frequency} size="small" />
              </div>
            </div>
            <p>{p.description}</p>
            <Stack direction="row" spacing={1}>
              {(p.required_scopes || []).map((s: string) => <Chip key={s} label={s} size="small" variant="outlined" />)}
            </Stack>
            <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => loadPreview(p.type)}>Preview Sample</Button>
          </Paper>
        ))}

        {preview && selectedProduct && (
          <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: '#fafafa' }}>
            <h3>Preview: {selectedProduct.name}</h3>
            <p>Matching properties: {preview.total_matching}</p>
            <pre style={{ maxHeight: 400, overflow: 'auto', fontSize: 12, background: '#f0f0f0', padding: 12, borderRadius: 4 }}>
              {JSON.stringify(preview.rows || [], null, 2)}
            </pre>
          </Paper>
        )}
      </main>
    </Layout>
  )
}

export default DataProducts
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Paper, Button, Typography, Chip, Table, TableBody, TableCell, TableHead, TableRow, Stack } from '@mui/material'
import { toast } from 'react-toastify'
import Layout from '@/components/Layout'
import axiosInstance from '@/services/axiosInstance'

import '@/assets/css/api-docs.css'

const ActivationSupplyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState<any>(null)
  const [evidence, setEvidence] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const propRes = await axiosInstance.get(`/api/v1/properties/${id}`, { withCredentials: true })
        setProperty(propRes.data)
        const evRes = await axiosInstance.get(`/api/v1/supply/properties/${id}/evidence`, { withCredentials: true })
        setEvidence(evRes.data.rows || [])
      } catch {
        toast.error('Failed to load property')
      }
      setLoading(false)
    }
    if (id) {
 load() 
}
  }, [id])

  if (loading) {
    return (
      <Layout strict>
        <main className="api-docs"><p>Loading...</p></main>
      </Layout>
    )
  }

  if (!property) {
    return (
      <Layout strict>
        <main className="api-docs"><p>Property not found.</p></main>
      </Layout>
    )
  }

  return (
    <Layout strict>
      <main className="api-docs" style={{ maxWidth: 800, margin: '0 auto' }}>
        <section className="api-docs-hero">
          <p>EstateOS Network</p>
          <h1>{property.title || 'Property Detail'}</h1>
          <span>Manage your property data claim and attached evidence.</span>
        </section>

        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Property Info</Typography>
            <Typography variant="body2">Type: {property.property_type}</Typography>
            <Typography variant="body2">Listing: {property.listing_type}</Typography>
            <Typography variant="body2">Price: {property.price?.amount?.toLocaleString()} {property.price?.currency}</Typography>
            <Typography variant="body2">Trust Score: {property.trust_state_summary?.trust_score}</Typography>
            <Typography variant="body2">Risk Score: {property.trust_state_summary?.risk_score}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {(property.trust_state_summary?.labels || []).map((l: string) => (
                <Chip key={l} label={l} size="small" />
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Evidence</Typography>
            {evidence.length === 0 ? (
              <Typography variant="body2">No evidence attached yet.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Visibility</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Summary</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evidence.map((ev: any) => (
                    <TableRow key={ev._id || ev.id}>
                      <TableCell>{ev.evidence_type}</TableCell>
                      <TableCell>{ev.visibility}</TableCell>
                      <TableCell>{ev.review_status || ev.status}</TableCell>
                      <TableCell>{ev.summary || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => {
              navigate(`/supply/${id}/evidence/new`)
            }}>Attach Evidence</Button>
          </Paper>

          <Button variant="text" onClick={() => navigate('/supply')}>Back to Supply Dashboard</Button>
        </Stack>
      </main>
    </Layout>
  )
}

export default ActivationSupplyDetail

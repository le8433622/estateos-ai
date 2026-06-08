import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Paper, Button, Typography, Chip, Table, TableBody, TableCell, TableHead, TableRow,
  Stack, Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, FormControlLabel,
  Radio, FormControl, FormLabel,
} from '@mui/material'
import { toast } from 'react-toastify'
import Layout from '@/components/Layout'
import axiosInstance from '@/services/axiosInstance'

import '@/assets/css/api-docs.css'

const VERIFICATION_PACKAGES = [
  { package_type: 'basic_cleanup_100k', name: 'Basic Cleanup', price: '100,000 VND' },
  { package_type: 'verified_photo_contact_location_300k', name: 'Verified Photo / Contact / Location', price: '300,000 VND' },
  { package_type: 'field_check_500k_1m', name: 'Field Check', price: '750,000 VND' },
]

const ActivationSupplyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState<any>(null)
  const [evidence, setEvidence] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pkgDialogOpen, setPkgDialogOpen] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState(VERIFICATION_PACKAGES[0].package_type)
  const [requesting, setRequesting] = useState(false)

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

  const handleRequestPackage = async () => {
    setRequesting(true)
    try {
      await axiosInstance.post('/api/v1/billing/verification-packages', {
        property_id: id,
        package_type: selectedPkg,
      }, { withCredentials: true })
      toast.success('Verification package requested. Invoice issued.')
      setPkgDialogOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to request package')
    }
    setRequesting(false)
  }

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
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => navigate(`/supply/${id}/evidence/new`)}>Attach Evidence</Button>
              <Button variant="contained" onClick={() => setPkgDialogOpen(true)}>Request Verification</Button>
            </Stack>
          </Paper>

          <Button variant="text" onClick={() => navigate('/supply')}>Back to Supply Dashboard</Button>

          <Dialog open={pkgDialogOpen} onClose={() => setPkgDialogOpen(false)}>
            <DialogTitle>Request Verification Package</DialogTitle>
            <DialogContent>
              <FormControl>
                <FormLabel>Select package type</FormLabel>
                <RadioGroup value={selectedPkg} onChange={(e) => setSelectedPkg(e.target.value)}>
                  {VERIFICATION_PACKAGES.map((pkg) => (
                    <FormControlLabel
                      key={pkg.package_type}
                      value={pkg.package_type}
                      control={<Radio />}
                      label={<Typography variant="body2"><strong>{pkg.name}</strong> — {pkg.price}</Typography>}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPkgDialogOpen(false)} disabled={requesting}>Cancel</Button>
              <Button variant="contained" onClick={handleRequestPackage} disabled={requesting}>
                {requesting ? 'Requesting...' : 'Request Package'}
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </main>
    </Layout>
  )
}

export default ActivationSupplyDetail

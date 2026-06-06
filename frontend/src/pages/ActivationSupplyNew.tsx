import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Paper, TextField, MenuItem, Stack } from '@mui/material'
import { toast } from 'react-toastify'
import Layout from '@/components/Layout'

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'plot', label: 'Plot / Land' },
  { value: 'commercial', label: 'Commercial / Shophouse' },
  { value: 'farm', label: 'Farm' },
]

const LISTING_TYPES = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'project', label: 'Project' },
  { value: 'data_claim', label: 'Data Claim' },
]

const ActivationSupplyNew = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [listingType, setListingType] = useState('sale')
  const [propertyType, setPropertyType] = useState('house')
  const [price, setPrice] = useState('')
  const [size, setSize] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title) {
      toast.error('Title is required')
      return
    }
    setSubmitting(true)
    try {
      const axiosInstance = (await import('@/services/axiosInstance')).default
      const res = await axiosInstance.post('/api/v1/supply/properties', {
        title,
        listing_type: listingType,
        property_type: propertyType,
        price: { amount: Number(price) || 0 },
        size: Number(size) || 0,
        description,
        location_precision: 'approximate',
        location_public: { city: '', display_name: 'Approximate location' },
      }, { withCredentials: true })
      const prop = res.data.property
      toast.success('Property claim created')
      navigate(`/supply/${prop.id}`)
    } catch {
      toast.error('Failed to create property claim')
    }
    setSubmitting(false)
  }

  return (
    <Layout strict>
      <main className="api-docs" style={{ maxWidth: 640, margin: '0 auto' }}>
        <section className="api-docs-hero">
          <p>EstateOS Network</p>
          <h1>New Property Claim</h1>
          <span>Submit a structured data claim for a real estate asset.</span>
        </section>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
            <TextField select label="Listing Type" value={listingType} onChange={(e) => setListingType(e.target.value)} fullWidth>
              {LISTING_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField select label="Property Type" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} fullWidth>
              {PROPERTY_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField label="Price (VND)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth />
            <TextField label="Size (m²)" type="number" value={size} onChange={(e) => setSize(e.target.value)} fullWidth />
            <TextField label="Description" multiline minRows={3} value={description} onChange={(e) => setDescription(e.target.value)} fullWidth />
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
            <Button variant="text" onClick={() => navigate('/supply')}>Cancel</Button>
          </Stack>
        </Paper>
      </main>
    </Layout>
  )
}

export default ActivationSupplyNew

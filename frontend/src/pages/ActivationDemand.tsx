import React, { useState, useEffect } from 'react'
import { Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, Stack, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { toast } from 'react-toastify'
import Layout from '@/components/Layout'
import * as activationService from '@/services/EstateOSActivationService'
import { useUserContext, UserContextType } from '@/context/UserContext'

import '@/assets/css/api-docs.css'

const DEMAND_TYPES = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'renter', label: 'Renter' },
  { value: 'investor', label: 'Investor' },
  { value: 'partner', label: 'Partner' },
]

const ActivationDemand = () => {
  const { user } = useUserContext() as UserContextType
  const [profiles, setProfiles] = useState<any[]>([])
  const [demandProfiles, setDemandProfiles] = useState<any[]>([])
  const [savedProperties, setSavedProperties] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    demand_type: 'buyer',
    target_locations: '',
    budget_min: '',
    budget_max: '',
    currency: 'VND',
  })

  useEffect(() => {
    const init = async () => {
      try {
        const profileData = await activationService.listOwnProfiles()
        setProfiles(profileData.rows || [])
        const hasDemandProfile = (profileData.rows || []).some(
          (p: any) => ['PropertyDemandAccount', 'PlatformOperatorAccount'].includes(p.profile_type),
        )
        if (hasDemandProfile) {
          const [demandData, savedData] = await Promise.all([
            activationService.listDemandProfiles(),
            activationService.listSavedProperties(),
          ])
          setDemandProfiles(demandData.rows || [])
          setSavedProperties(savedData.rows || [])
        }
      } catch {
        // not loaded
      }
    }
    init()
  }, [user])

  const handleCreateProfile = async () => {
    try {
      await activationService.createOwnProfile({ profile_type: 'PropertyDemandAccount' })
      const profileData = await activationService.listOwnProfiles()
      setProfiles(profileData.rows || [])
      toast.success('Demand profile activated')
    } catch {
      toast.error('Failed to activate profile')
    }
  }

  const handleCreateDemandProfile = async () => {
    try {
      const data: any = {
        demand_type: formData.demand_type,
        target_locations: formData.target_locations.split(',').map((s) => s.trim()).filter(Boolean),
        currency: formData.currency,
      }
      if (formData.budget_min) {
 data.budget_min = Number(formData.budget_min) 
}
      if (formData.budget_max) {
 data.budget_max = Number(formData.budget_max) 
}
      await activationService.createDemandProfile(data)
      const demandData = await activationService.listDemandProfiles()
      setDemandProfiles(demandData.rows || [])
      setDialogOpen(false)
      setFormData({ demand_type: 'buyer', target_locations: '', budget_min: '', budget_max: '', currency: 'VND' })
      toast.success('Demand profile created')
    } catch {
      toast.error('Failed to create demand profile')
    }
  }

  const handleDeleteDemandProfile = async (id: string) => {
    try {
      await activationService.deleteDemandProfile(id)
      setDemandProfiles((prev) => prev.filter((p) => p._id !== id))
      toast.success('Demand profile deleted')
    } catch {
      toast.error('Failed to delete demand profile')
    }
  }

  const handleRemoveSaved = async (propertyId: string) => {
    try {
      await activationService.removeSavedProperty(propertyId)
      setSavedProperties((prev) => prev.filter((s) => s.property?.id !== propertyId))
      toast.success('Removed from saved')
    } catch {
      toast.error('Failed to remove')
    }
  }

  const hasDemandProfile = profiles.some(
    (p: any) => ['PropertyDemandAccount', 'PlatformOperatorAccount'].includes(p.profile_type),
  )

  return (
    <Layout strict>
      <main className="api-docs">
        <section className="api-docs-hero">
          <p>EstateOS Network</p>
          <h1>Demand Activation</h1>
          <span>Set up your property demand profile and track properties you are interested in.</span>
        </section>

        <section className="api-docs-grid">
          <Paper className="api-docs-card">
            <h2>Your Demand Profile</h2>
            {!hasDemandProfile ? (
              <>
                <p>No demand profile yet. Activate one to start expressing property interest.</p>
                <Button variant="contained" onClick={handleCreateProfile}>Activate Demand Profile</Button>
              </>
            ) : (
              <p>Demand profile is active.</p>
            )}
          </Paper>

          {hasDemandProfile && (
            <>
              <Paper className="api-docs-card">
                <h2>Demand Signals</h2>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                  setEditId(null)
                  setFormData({ demand_type: 'buyer', target_locations: '', budget_min: '', budget_max: '', currency: 'VND' })
                  setDialogOpen(true)
                }} sx={{ mb: 2 }}>
                  Create Demand Signal
                </Button>
                {demandProfiles.length === 0 ? (
                  <p>No demand signals yet. Create one to express your property interest.</p>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Locations</TableCell>
                        <TableCell>Budget</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {demandProfiles.map((dp: any) => (
                        <TableRow key={dp._id}>
                          <TableCell>{dp.demand_type}</TableCell>
                          <TableCell>{(dp.target_locations || []).join(', ')}</TableCell>
                          <TableCell>{dp.budget_min?.toLocaleString()} - {dp.budget_max?.toLocaleString()} {dp.currency}</TableCell>
                          <TableCell><Chip label={dp.qualification_status} size="small" /></TableCell>
                          <TableCell>
                            <Button size="small" color="error" onClick={() => handleDeleteDemandProfile(dp._id)}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>

              <Paper className="api-docs-card">
                <h2>Saved Properties ({savedProperties.length})</h2>
                {savedProperties.length === 0 ? (
                  <p>No saved properties yet. Browse properties and save them for later.</p>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Property</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell>Saved</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {savedProperties.map((s: any) => (
                        <TableRow key={s.saved_id}>
                          <TableCell>{s.property?.title || 'Unknown'}</TableCell>
                          <TableCell>{s.notes || '—'}</TableCell>
                          <TableCell>{s.saved_at ? new Date(s.saved_at).toLocaleDateString() : '—'}</TableCell>
                          <TableCell>
                            <Button size="small" color="error" onClick={() => handleRemoveSaved(s.property?.id)}>Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            </>
          )}
        </section>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editId ? 'Edit Demand Signal' : 'Create Demand Signal'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Demand Type" value={formData.demand_type} onChange={(e) => setFormData({ ...formData, demand_type: e.target.value })} fullWidth>
                {DEMAND_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
              <TextField label="Target Locations (comma-separated)" value={formData.target_locations} onChange={(e) => setFormData({ ...formData, target_locations: e.target.value })} fullWidth
                helperText="e.g. District 1, Thu Duc, Vinh" />
              <TextField label="Min Budget" type="number" value={formData.budget_min} onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })} fullWidth />
              <TextField label="Max Budget" type="number" value={formData.budget_max} onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })} fullWidth />
              <TextField select label="Currency" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} fullWidth>
                <MenuItem value="VND">VND</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateDemandProfile}>Create</Button>
          </DialogActions>
        </Dialog>
      </main>
    </Layout>
  )
}

export default ActivationDemand

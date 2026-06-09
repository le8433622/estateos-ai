import React, { useState, useEffect } from 'react'
import {
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Alert,
  Stack,
} from '@mui/material'
import { Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { strings as commonStrings } from '@/lang/common'
import * as helper from '@/utils/helper'
import Layout from '@/components/Layout'
import axiosInstance from '@/services/axiosInstance'
import '@/assets/css/estateos-command-center.css'

interface CleanupInfo {
  qaPropertyCount: number
  qaApiKeyCount: number
}

interface CleanupResult {
  deletedProperties: number
  deletedPropertyClaims: number
  deletedApiKeys: number
}

const EstateOSCleanupTools = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [info, setInfo] = useState<CleanupInfo>({ qaPropertyCount: 0, qaApiKeyCount: 0 })
  const [result, setResult] = useState<CleanupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const fetchInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await axiosInstance.get('/api/v1/ops/cleanup', { withCredentials: true }).then(r => r.data)
      setInfo(data)
    } catch (err) {
      helper.error(err)
      setError('Failed to load cleanup info')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInfo()
  }, [])

  const handleCleanup = async () => {
    setConfirmOpen(false)
    try {
      setRunning(true)
      setError(null)
      setResult(null)
      const data: CleanupResult = await axiosInstance.post('/api/v1/ops/cleanup', {}, { withCredentials: true }).then(r => r.data)
      setResult(data)
      setInfo({ qaPropertyCount: 0, qaApiKeyCount: 0 })
    } catch (err) {
      helper.error(err)
      setError('Cleanup failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <Layout strict admin>
      <div className="estateos-cc">
        <div className="estateos-cc-header">
          <h1>Cleanup Tools</h1>
          <p className="estateos-cc-subtitle">Remove test and QA artifacts from the database</p>
        </div>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {result && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Deleted {result.deletedProperties} properties, {result.deletedPropertyClaims} claims, and {result.deletedApiKeys} API keys.
          </Alert>
        )}

        <Paper className="estateos-section" sx={{ p: 3 }}>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Artifact Type</strong></TableCell>
                    <TableCell><strong>Count</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>QA Test Properties</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={info.qaPropertyCount > 0 ? 'warning' : 'default'}
                        label={info.qaPropertyCount}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>QA Test API Keys</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={info.qaApiKeyCount > 0 ? 'warning' : 'default'}
                        label={info.qaApiKeyCount}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={running ? <CircularProgress size={20} /> : <DeleteIcon />}
                  disabled={running || (info.qaPropertyCount === 0 && info.qaApiKeyCount === 0)}
                  onClick={() => setConfirmOpen(true)}
                >
                  {running ? 'Deleting...' : 'Delete All QA Test Data'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchInfo}
                  disabled={running}
                >
                  Refresh
                </Button>
              </Stack>
            </>
          )}
        </Paper>
      </div>

      <Dialog disableEscapeKeyDown maxWidth="xs" open={confirmOpen}>
        <DialogTitle>Confirm Cleanup</DialogTitle>
        <DialogContent>
          This will permanently delete {info.qaPropertyCount} QA test propert{info.qaPropertyCount === 1 ? 'y' : 'ies'} and {info.qaApiKeyCount} API key{info.qaApiKeyCount === 1 ? '' : 's'}.
          <br /><br />
          This action cannot be undone.
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setConfirmOpen(false)} variant="contained" className="btn-secondary">
            Cancel
          </Button>
          <Button onClick={handleCleanup} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default EstateOSCleanupTools

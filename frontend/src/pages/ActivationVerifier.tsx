import React, { useState, useEffect } from 'react'
import { Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material'
import Layout from '@/components/Layout'
import * as activationService from '@/services/EstateOSActivationService'
import { useUserContext, UserContextType } from '@/context/UserContext'

import '@/assets/css/api-docs.css'

const ActivationVerifier = () => {
  const { user } = useUserContext() as UserContextType
  const [profiles, setProfiles] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      try {
        const profileData = await activationService.listOwnProfiles()
        setProfiles(profileData.rows || [])
        const hasVerifierProfile = (profileData.rows || []).some(
          (p: any) => ['VerificationOperatorAccount', 'PlatformOperatorAccount'].includes(p.profile_type),
        )
        if (hasVerifierProfile) {
          const verifierData = await activationService.listOwnVerifierJobs()
          setJobs(verifierData.jobs || [])
          setReports(verifierData.reports || [])
        }
      } catch {
        // not loaded
      }
    }
    init()
  }, [user])

  const handleCreateProfile = async () => {
    try {
      await activationService.createOwnProfile({ profile_type: 'VerificationOperatorAccount' })
      const profileData = await activationService.listOwnProfiles()
      setProfiles(profileData.rows || [])
    } catch {
      // silently fail
    }
  }

  const hasVerifierProfile = profiles.some(
    (p: any) => ['VerificationOperatorAccount', 'PlatformOperatorAccount'].includes(p.profile_type),
  )

  return (
    <Layout strict>
      <main className="api-docs">
        <section className="api-docs-hero">
          <p>EstateOS Network</p>
          <h1>Verifier Activation</h1>
          <span>Accept verification jobs, submit reports, and build your verifier reputation.</span>
        </section>

        <section className="api-docs-grid">
          <Paper className="api-docs-card">
            <h2>Your Verifier Profile</h2>
            {!hasVerifierProfile ? (
              <>
                <p>No verifier profile yet. Activate one to start accepting verification jobs.</p>
                <Button variant="contained" onClick={handleCreateProfile}>Activate Verifier Profile</Button>
              </>
            ) : (
              <p>Verifier profile is active.</p>
            )}
          </Paper>

          {hasVerifierProfile && (
            <>
              <Paper className="api-docs-card">
                <h2>Assigned Jobs ({jobs.length})</h2>
                {jobs.length === 0 ? (
                  <p>No verification jobs assigned yet.</p>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Assigned</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {jobs.map((job: any) => (
                        <TableRow key={job._id}>
                          <TableCell><code>{job._id?.toString().slice(-6)}</code></TableCell>
                          <TableCell>{job.verification_type || '—'}</TableCell>
                          <TableCell><Chip label={job.status} size="small" color={job.status === 'assigned' ? 'warning' : 'default'} /></TableCell>
                          <TableCell>{job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>

              <Paper className="api-docs-card">
                <h2>Your Reports ({reports.length})</h2>
                {reports.length === 0 ? (
                  <p>No reports submitted yet.</p>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Job ID</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Confidence</TableCell>
                        <TableCell>Submitted</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((rpt: any) => (
                        <TableRow key={rpt._id}>
                          <TableCell><code>{rpt.job_id?.toString().slice(-6)}</code></TableCell>
                          <TableCell><Chip label={rpt.status || rpt.report_status} size="small" /></TableCell>
                          <TableCell>{rpt.confidence_level || rpt.confidence || '—'}</TableCell>
                          <TableCell>{rpt.submitted_at ? new Date(rpt.submitted_at).toLocaleDateString() : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            </>
          )}
        </section>
      </main>
    </Layout>
  )
}

export default ActivationVerifier

import React from 'react'
import { Chip, Paper } from '@mui/material'

import '@/assets/css/api-docs.css'

const examples = [
  {
    title: 'List public properties',
    method: 'GET',
    path: '/api/v1/properties',
    scope: 'properties:read_public',
    body: null,
  },
  {
    title: 'Read property trust state',
    method: 'GET',
    path: '/api/v1/properties/:id/trust-state',
    scope: 'properties:read_trust_state',
    body: null,
  },
  {
    title: 'Create API key',
    method: 'POST',
    path: '/api/v1/api-keys',
    scope: 'api:create_key account permission',
    body: {
      name: 'Partner data app',
      scopes: ['properties:read_public', 'properties:read_trust_state', 'billing:read'],
    },
  },
  {
    title: 'Submit supply property claim',
    method: 'POST',
    path: '/api/v1/supply/properties',
    scope: 'property:create_claim account permission',
    body: {
      title: 'Vinh townhouse data claim',
      listing_type: 'sale',
      property_type: 'townhouse',
      price: 2400000000,
      size: 96,
      location_precision: 'district_plus_area',
      location_public: { city: 'Vinh', district: 'Vinh City', display_name: 'Vinh approximate area' },
    },
  },
  {
    title: 'Attach evidence',
    method: 'POST',
    path: '/api/v1/supply/properties/:id/evidence',
    scope: 'property:upload_evidence account permission',
    body: {
      evidence_type: 'photo',
      visibility: 'private',
      redaction_state: 'restricted',
      summary: 'Evidence status only; raw file remains private.',
    },
  },
  {
    title: 'Read API usage',
    method: 'GET',
    path: '/api/v1/api-usage',
    scope: 'api:read_usage account permission',
    body: null,
  },
  {
    title: 'List Data Products',
    method: 'GET',
    path: '/api/v1/data-products',
    scope: 'No auth required (public catalog)',
    body: null,
  },
  {
    title: 'Preview Data Product',
    method: 'GET',
    path: '/api/v1/data-products/:type/preview',
    scope: 'plan + scopes per product type',
    body: null,
  },
  {
    title: 'Export Data Product',
    method: 'GET',
    path: '/api/v1/data-products/:type/export',
    scope: 'plan + scopes per product type (API key or session)',
    body: null,
  },
  {
    title: 'Data Product Feed',
    method: 'GET',
    path: '/api/v1/data-products/:type/feed?since=&page=&limit=',
    scope: 'plan + scopes per product type (API key or session)',
    body: null,
  },
  {
    title: 'Create Webhook',
    method: 'POST',
    path: '/api/v1/webhooks',
    scope: 'api:create_key account permission',
    body: { url: 'https://example.com/webhook', events: ['property.created', 'property.quality_changed'], description: 'My webhook' },
  },
]

const ApiDocs = () => (
  <main className="api-docs">
    <section className="api-docs-hero">
      <p>EstateOS API Marketplace OS</p>
      <h1>Developer API Docs And Playground</h1>
      <span>
        Use scoped API keys to read claim-based property data, trust state, and usage metrics.
        Sensitive evidence, owner identity, exact private location, and legal-clean claims are never public defaults.
      </span>
    </section>

    <section className="api-docs-grid">
      <Paper className="api-docs-card">
        <h2>Authentication</h2>
        <p>Partner calls use `x-api-key` or `Authorization: Bearer eos_...`.</p>
        <p>Key secrets are shown once and stored hashed at rest.</p>
      </Paper>
      <Paper className="api-docs-card">
        <h2>Visibility Rules</h2>
        <p>Public responses expose approximate location, trust summaries, redacted evidence status, and no raw sensitive evidence.</p>
        <p>Partner fields require scope plus property `api_visibility` allowance.</p>
      </Paper>
      <Paper className="api-docs-card">
        <h2>Forbidden Claims</h2>
        <p>EstateOS does not return `legal_clean`, `safe_to_buy`, `guaranteed_ownership`, `no_planning_risk`, or `risk_free` labels.</p>
      </Paper>
    </section>

    <section className="api-docs-endpoints">
      {examples.map((example) => (
        <Paper className="api-docs-endpoint" key={`${example.method}-${example.path}`}>
          <div className="api-docs-endpoint-header">
            <Chip label={example.method} size="small" />
            <h2>{example.title}</h2>
          </div>
          <code>{example.path}</code>
          <p>Required: {example.scope}</p>
          <pre>{JSON.stringify(example.body || { headers: { 'x-api-key': 'eos_...' } }, null, 2)}</pre>
        </Paper>
      ))}
    </section>
  </main>
)

export default ApiDocs

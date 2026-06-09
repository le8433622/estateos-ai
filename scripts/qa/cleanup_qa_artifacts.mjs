#!/usr/bin/env node

/**
 * Cleanup QA artifacts from the database.
 * Removes properties and API keys created by the QA permission matrix tests.
 *
 * Usage:
 *   MI_DB_URI="mongodb+srv://..." node scripts/qa/cleanup_qa_artifacts.mjs
 *
 * Or set MONGODB_URI or MI_DB_URI as environment variable.
 * For Render production, use Render Shell or a jumpbox with network access to Atlas.
 */

import mongoose from 'mongoose'
import process from 'node:process'

const MONGODB_URI = process.env.MONGODB_URI || process.env.MI_DB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI or MI_DB_URI must be set')
  process.exit(1)
}

async function run() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  const db = mongoose.connection.db
  if (!db) {
    console.error('No database connection')
    process.exit(1)
  }

  // Find QA test property IDs
  const properties = await db.collection('Property').find({ name: /^QA Test / }).project({ _id: 1 }).toArray()
  const propertyIds = properties.map(p => p._id)
  console.log(`Found ${propertyIds.length} QA test properties`)

  if (propertyIds.length > 0) {
    // Delete associated claims
    const claimResult = await db.collection('PropertyClaim').deleteMany({ property_id: { $in: propertyIds } })
    console.log(`  Deleted ${claimResult.deletedCount} PropertyClaim records`)

    // Delete properties
    const propResult = await db.collection('Property').deleteMany({ _id: { $in: propertyIds } })
    console.log(`  Deleted ${propResult.deletedCount} Property records`)
  }

  // Delete QA test API keys
  const keyResult = await db.collection('ApiKey').deleteMany({ name: /^QA Test / })
  console.log(`Deleted ${keyResult.deletedCount} QA test API keys`)

  await mongoose.disconnect()
  console.log('Cleanup complete')
}

run().catch((err) => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})

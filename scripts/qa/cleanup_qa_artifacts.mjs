#!/usr/bin/env node

/**
 * Cleanup QA artifacts from production database.
 * Removes properties and API keys created by the QA permission matrix tests.
 *
 * Usage:
 *   node scripts/qa/cleanup_qa_artifacts.mjs
 *
 * Requires MONGODB_URI environment variable to be set.
 */

import mongoose from 'mongoose'
import process from 'node:process'

const MONGODB_URI = process.env.MONGODB_URI || process.env.MI_DB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI or MI_DB_URI must be set')
  process.exit(1)
}

async function run() {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  // Load models directly
  const Property = (await import('../../backend/src/models/Property.js')).default
  const PropertyClaim = (await import('../../backend/src/models/PropertyClaim.js')).default
  const ApiKey = (await import('../../backend/src/models/ApiKey.js')).default

  // Delete QA test properties (created with title "QA Test Property")
  const qaProperties = await Property.find({ name: /^QA Test / }).lean()
  console.log(`Found ${qaProperties.length} QA test properties`)

  for (const p of qaProperties) {
    await PropertyClaim.deleteMany({ property_id: p._id })
    console.log(`  Deleted claims for property ${p._id}`)
  }

  const propResult = await Property.deleteMany({ name: /^QA Test / })
  console.log(`Deleted ${propResult.deletedCount} QA test properties`)

  // Delete QA test API keys (created with name "QA Test Key")
  const keyResult = await ApiKey.deleteMany({ name: /^QA Test / })
  console.log(`Deleted ${keyResult.deletedCount} QA test API keys`)

  await mongoose.disconnect()
  console.log('✅ Cleanup complete')
}

run().catch((err) => {
  console.error('❌ Cleanup failed:', err)
  process.exit(1)
})

import process from 'node:process'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import * as env from '../config/env.config'
import * as logger from '../utils/logger'

let s3Client: S3Client | null = null
let bucketName = ''
let publicUrlBase = ''

const isB2Configured = (): boolean => {
  const keyId = process.env.ES_B2_KEY_ID
  const appKey = process.env.ES_B2_APPLICATION_KEY
  const bucket = process.env.ES_B2_BUCKET
  return !!(keyId && appKey && bucket)
}

const getS3Client = (): S3Client => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.ES_B2_REGION || 'us-east-005',
      endpoint: process.env.ES_B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
      credentials: {
        accessKeyId: process.env.ES_B2_KEY_ID || '',
        secretAccessKey: process.env.ES_B2_APPLICATION_KEY || '',
      },
      forcePathStyle: true,
    })
    bucketName = process.env.ES_B2_BUCKET || 'estateos-storage'
    publicUrlBase = process.env.ES_B2_PUBLIC_URL || `https://f005.backblazeb2.com/file/${bucketName}`
  }
  return s3Client
}

const sanitizePath = (filePath: string): string => {
  return filePath.replace(/^\/+/, '').replace(/\/+/g, '/')
}

export const uploadFile = async (key: string, buffer: Buffer, contentType?: string): Promise<string> => {
  if (isB2Configured()) {
    try {
      const client = getS3Client()
      const safeKey = sanitizePath(key)
      await client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: safeKey,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      }))
      logger.info(`B2 upload success: ${safeKey} (${buffer.length} bytes)`)
      return `${publicUrlBase}/${safeKey}`
    } catch (err) {
      logger.error('B2 upload failed, falling back to local CDN:', err)
    }
  }
  return ''
}

export const downloadFile = async (key: string): Promise<Buffer | null> => {
  if (isB2Configured()) {
    try {
      const client = getS3Client()
      const safeKey = sanitizePath(key)
      const response = await client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: safeKey,
      }))
      return Buffer.from(await response.Body!.transformToByteArray())
    } catch (err) {
      logger.error('B2 download failed:', err)
    }
  }
  return null
}

export const deleteFile = async (key: string): Promise<boolean> => {
  if (isB2Configured()) {
    try {
      const client = getS3Client()
      const safeKey = sanitizePath(key)
      await client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: safeKey,
      }))
      logger.info(`B2 delete success: ${safeKey}`)
      return true
    } catch (err) {
      logger.error('B2 delete failed:', err)
    }
  }
  return false
}

export const fileExists = async (key: string): Promise<boolean> => {
  if (isB2Configured()) {
    try {
      const client = getS3Client()
      const safeKey = sanitizePath(key)
      const result = await client.send(new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: safeKey,
        MaxKeys: 1,
      }))
      return (result.Contents || []).length > 0
    } catch {
      return false
    }
  }
  return false
}

export const getSignedDownloadUrl = async (key: string, expiresInSeconds = 3600): Promise<string | null> => {
  if (isB2Configured()) {
    try {
      const client = getS3Client()
      const safeKey = sanitizePath(key)
      const url = await getSignedUrl(client, new GetObjectCommand({
        Bucket: bucketName,
        Key: safeKey,
      }), { expiresIn: expiresInSeconds })
      return url
    } catch (err) {
      logger.error('B2 signed URL generation failed:', err)
    }
  }
  return null
}

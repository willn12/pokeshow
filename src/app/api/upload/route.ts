import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
const MAX_IMAGE_BYTES = 20 * 1024 * 1024   // 20 MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024  // 200 MB

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const isImage = IMAGE_TYPES.includes(file.type)
  const isVideo = VIDEO_TYPES.includes(file.type)

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: 'Only image (JPG, PNG, GIF, WebP) or video (MP4, WebM, MOV) files are allowed' },
      { status: 400 },
    )
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Max size: ${isVideo ? '200MB' : '20MB'}` },
      { status: 400 },
    )
  }

  // Production: upload to Cloudinary
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET) {
    const upload = new FormData()
    upload.append('file', file)
    upload.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET)

    // Use the appropriate resource type endpoint
    const resourceType = isVideo ? 'video' : 'image'
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      { method: 'POST', body: upload },
    )
    if (!res.ok) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    const data = await res.json()
    return NextResponse.json({ url: data.secure_url, resourceType })
  }

  // Development: write to public/uploads
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = path.extname(file.name) || (isVideo ? '.mp4' : '.jpg')
  const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)
  return NextResponse.json({ url: `/uploads/${filename}`, resourceType: isVideo ? 'video' : 'image' })
}

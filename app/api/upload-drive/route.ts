import { uploadToDrive } from '@/lib/google-drive'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada berkas yang dikirim' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const driveUrl = await uploadToDrive(
      buffer,
      `${Date.now()}_${file.name}`,
      file.type
    )

    if (!driveUrl) {
      return NextResponse.json({ error: 'Gagal mengunggah berkas ke Google Drive' }, { status: 500 })
    }

    return NextResponse.json({ url: driveUrl })
  } catch (error: any) {
    console.error('Error in upload-drive route:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
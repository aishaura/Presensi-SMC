import { google } from 'googleapis'
import { Readable } from 'stream'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.file'],
})

export async function uploadToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
  const drive = google.drive({ version: 'v3', auth })

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    },
    media: {
      mimeType,
      body: Readable.from(fileBuffer),
    },
    fields: 'id, webViewLink',
  })

  await drive.permissions.create({
    fileId: response.data.id!,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  return {
    fileId: response.data.id!,
    webViewLink: response.data.webViewLink!,
  }
}
export async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const credentialsJson = process.env.GOOGLE_DRIVE_CREDENTIALS_JSON
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  if (!credentialsJson || !folderId) {
    console.warn(
      'GOOGLE_DRIVE_CREDENTIALS_JSON atau GOOGLE_DRIVE_FOLDER_ID tidak terkonfigurasi. Menggunakan fallback Supabase Storage.'
    )
    return ''
  }

  try {
    const credentials = JSON.parse(credentialsJson)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })
    
    const bufferStream = new Readable()
    bufferStream.push(fileBuffer)
    bufferStream.push(null)

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    }

    const media = {
      mimeType: mimeType,
      body: bufferStream,
    }

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    })

    const fileId = file.data.id

    if (!fileId) {
      throw new Error('Gagal mendapatkan ID file dari Google Drive')
    }

    // Ubah permissions agar file bisa dilihat oleh siapa saja (public link)
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    // Dapatkan webViewLink terbaru
    const fileInfo = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink',
    })

    return fileInfo.data.webViewLink || ''
  } catch (error) {
    console.error('Error saat upload ke Google Drive:', error)
    return ''
  }
}

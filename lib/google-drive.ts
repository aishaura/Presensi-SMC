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
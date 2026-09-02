import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendRecapEmail(subject: string, htmlContent: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: 'Presensi SMC <onboarding@resend.dev>', // ganti kalau domain sendiri udah diverifikasi
      to: process.env.ADMIN_EMAIL!,
      subject,
      html: htmlContent,
    })

    if (error) {
      console.error('Resend error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Gagal kirim email:', err)
    return false
  }
}
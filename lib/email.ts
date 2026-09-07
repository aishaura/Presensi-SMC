import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendRecapEmail(subject: string, htmlContent: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `Presensi SMC <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject,
      html: htmlContent,
    })
    return true
  } catch (err) {
    console.error('Gagal kirim email:', err)
    return false
  }
}
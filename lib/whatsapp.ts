export async function sendWhatsApp(message: string, target?: string): Promise<boolean> {
  const target_number = target ?? process.env.ADMIN_WHATSAPP_NUMBER

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: process.env.FONNTE_TOKEN!,
      },
      body: new URLSearchParams({
        target: target_number!,
        message,
      }),
    })

    const result = await response.json()

    if (!result.status) {
      console.error('Fonnte error:', result)
      return false
    }

    return true
  } catch (err) {
    console.error('Gagal kirim WhatsApp:', err)
    return false
  }
}
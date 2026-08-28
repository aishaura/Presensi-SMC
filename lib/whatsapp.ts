export async function sendWhatsAppNotification(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  const apiKey = process.env.FONNTE_API_TOKEN // Menggunakan Fonnte sebagai contoh penyedia API WA populer di Indonesia
  
  if (!apiKey || !phoneNumber) {
    console.log(`[WhatsApp Mock] Mengirim pesan ke ${phoneNumber || 'tanpa nomor'}: \n"${message}"`)
    return true
  }

  try {
    // Normalisasi format nomor telepon (misal dari 08xx ke 62xx atau +62xx ke 62xx)
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1)
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
      }),
    })

    if (!response.ok) {
      console.error('WhatsApp API response error:', response.statusText)
      return false
    }

    const result = await response.json()
    return result.status === true
  } catch (error) {
    console.error('Gagal mengirim notifikasi WhatsApp:', error)
    return false
  }
}

import { config } from 'dotenv'
config({ path: '.env.local' })

import { sendWhatsApp } from '../lib/whatsapp'

async function test() {
  const success = await sendWhatsApp('Test dari presensi-smc — kalau ini kekirim, integrasi berhasil ✅')
  console.log(success ? '✅ Berhasil kirim' : '❌ Gagal kirim')
}

test()
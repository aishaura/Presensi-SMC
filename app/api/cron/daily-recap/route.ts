import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp } from '@/lib/whatsapp'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    const today = new Date()
    const offset = today.getTimezoneOffset()
    const localDate = new Date(today.getTime() - offset * 60 * 1000)
    const todayStr = localDate.toISOString().split('T')[0]

    const { data: attendances, error } = await supabase
      .from('attendance')
      .select(`
        keterangan, check_in_time, check_out_time,
        check_out_address, check_out_image_url,
        profile:profiles(name)
      `)
      .eq('date', todayStr)
      .order('check_in_time', { ascending: true })

    if (error) {
      console.error('Error fetching attendance:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const message = formatRecapMessage(todayStr, attendances ?? [])
    const sent = await sendWhatsApp(message)

    return NextResponse.json({ success: sent, totalRecords: attendances?.length ?? 0 })
  } catch (err: any) {
    console.error('Cron daily-recap error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

function formatRecapMessage(date: string, records: any[]): string {
  if (records.length === 0) {
    return `📋 *Rekap Presensi ${date}*\n\nTidak ada karyawan yang melakukan presensi hari ini.`
  }

  const lines = records.map((r, i) => {
    const name = r.profile?.name ?? 'Tidak diketahui'
    const checkIn = r.check_in_time
      ? new Date(r.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '-'

    // Izin: format ringkas, gak perlu jam pulang/lokasi/foto
    if (r.keterangan === 'Izin') {
      return `${i + 1}. *${name}* — Izin (diajukan pukul ${checkIn})`
    }

    const checkOut = r.check_out_time
      ? new Date(r.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : 'Belum check-out'

    let entry = `${i + 1}. *${name}* (${r.keterangan})\n   In: ${checkIn} | Out: ${checkOut}`

    if (r.check_out_address) {
      entry += `\n   📍 ${r.check_out_address}`
    }
    if (r.check_out_image_url) {
      entry += `\n   📷 Bukti: ${r.check_out_image_url}`
    }
    return entry
  })

  return `📋 *Rekap Presensi ${date}*\n\n${lines.join('\n\n')}\n\nTotal: ${records.length} karyawan`
}
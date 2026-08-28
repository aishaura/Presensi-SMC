import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp } from '@/lib/whatsapp'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Proteksi: cuma Vercel Cron yang boleh manggil endpoint ini
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient() // pakai service_role, bypass RLS, ambil semua data

    const today = new Date()
    const offset = today.getTimezoneOffset()
    const localDate = new Date(today.getTime() - offset * 60 * 1000)
    const todayStr = localDate.toISOString().split('T')[0]

    const { data: attendances, error } = await supabase
      .from('attendance')
      .select(`
        keterangan, check_in_time, check_out_time,
        check_in_address, check_in_image_url, check_out_image_url,
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
    const checkOut = r.check_out_time
      ? new Date(r.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : 'Belum check-out'

    let entry = `${i + 1}. *${name}* (${r.keterangan})\n   In: ${checkIn} | Out: ${checkOut}`
    if (r.check_in_image_url) {
      entry += `\n   📷 Bukti masuk: ${r.check_in_image_url}`
    }
    if (r.check_out_image_url) {
      entry += `\n   📷 Bukti pulang: ${r.check_out_image_url}`
    }
    return entry
  })

  return `📋 *Rekap Presensi ${date}*\n\n${lines.join('\n\n')}\n\nTotal: ${records.length} karyawan`
}
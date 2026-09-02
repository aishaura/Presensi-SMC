import { createAdminClient } from '@/lib/supabase/admin'
import { sendRecapEmail } from '@/lib/email'
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
        check_out_address, check_out_image_url, progress_note,
        profiles!attendance_user_id_fkey (name)
      `)
      .eq('date', todayStr)
      .order('check_in_time', { ascending: true })

    if (error) {
      console.error('Error fetching attendance:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const html = formatRecapEmail(todayStr, attendances ?? [])
    const sent = await sendRecapEmail(`Rekap Presensi — ${todayStr}`, html)

    return NextResponse.json({ success: sent, totalRecords: attendances?.length ?? 0 })
  } catch (err: any) {
    console.error('Cron daily-recap error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

function formatRecapEmail(date: string, records: any[]): string {
  const formattedDate = new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  if (records.length === 0) {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>📋 Rekap Presensi Saung Mirza</h2>
        <p style="color:#666;">${formattedDate}</p>
        <p>Tidak ada karyawan yang melakukan presensi hari ini.</p>
      </div>
    `
  }

  const rows = records.map((r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
    const name = profile?.name ?? 'Tidak diketahui'
    const checkIn = r.check_in_time
      ? new Date(r.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '-'

    if (r.keterangan === 'Izin') {
      return `
        <tr>
          <td style="padding:12px; border-bottom:1px solid #eee;"><strong>${name}</strong></td>
          <td style="padding:12px; border-bottom:1px solid #eee;">
            <span style="background:#fef3c7; color:#92400e; padding:2px 10px; border-radius:12px; font-size:12px;">Izin</span>
          </td>
          <td style="padding:12px; border-bottom:1px solid #eee;" colspan="3">Diajukan pukul ${checkIn}</td>
        </tr>
      `
    }

    const checkOut = r.check_out_time
      ? new Date(r.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : 'Belum check-out'

    const badgeColor = r.keterangan === 'WFA/WFH' ? '#ede9fe;color:#5b21b6' : '#dcfce7;color:#166534'

    return `
      <tr>
        <td style="padding:12px; border-bottom:1px solid #eee;"><strong>${name}</strong></td>
        <td style="padding:12px; border-bottom:1px solid #eee;">
          <span style="background:${badgeColor.split(';')[0]}; color:${badgeColor.split(';')[1].replace('color:','')}; padding:2px 10px; border-radius:12px; font-size:12px;">${r.keterangan}</span>
        </td>
        <td style="padding:12px; border-bottom:1px solid #eee;">${checkIn} - ${checkOut}</td>
        <td style="padding:12px; border-bottom:1px solid #eee; font-size:13px; color:#555;">${r.progress_note ?? '-'}</td>
        <td style="padding:12px; border-bottom:1px solid #eee;">
          ${r.check_out_image_url ? `<a href="${r.check_out_image_url}" style="color:#2563eb;">Lihat Foto</a>` : '-'}
        </td>
      </tr>
    `
  }).join('')

  return `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto;">
      <h2 style="margin-bottom:4px;">📋 Rekap Presensi</h2>
      <p style="color:#666; margin-top:0;">${formattedDate}</p>
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <thead>
          <tr style="background:#f9fafb; text-align:left; font-size:12px; text-transform:uppercase; color:#6b7280;">
            <th style="padding:12px;">Nama</th>
            <th style="padding:12px;">Status</th>
            <th style="padding:12px;">Jam</th>
            <th style="padding:12px;">Catatan</th>
            <th style="padding:12px;">Foto</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:16px; color:#666; font-size:13px;">Total: ${records.length} karyawan</p>
    </div>
  `
}
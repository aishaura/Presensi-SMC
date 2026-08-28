import { createClient } from '@/lib/supabase/server'
import { reverseGeocode } from '@/lib/geocode'
import { getRandomQuote } from '@/lib/quotes'
import { uploadToDrive } from '@/lib/google-drive'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const lat = parseFloat(formData.get('lat') as string)
    const lng = parseFloat(formData.get('lng') as string)
    const keterangan = formData.get('keterangan') as string
    const image = formData.get('image') as File

    if (isNaN(lat) || isNaN(lng) || !keterangan || !image) {
      return NextResponse.json({ success: false, error: 'Data formulir tidak lengkap' }, { status: 400 })
    }

    // Tanggal lokal hari ini (YYYY-MM-DD)
    const today = new Date()
    const offset = today.getTimezoneOffset()
    const localDate = new Date(today.getTime() - offset * 60 * 1000)
    const todayStr = localDate.toISOString().split('T')[0]

    // Cek udah check-in belum hari ini
    const { data: existingCheck } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle()

    if (existingCheck) {
      return NextResponse.json(
        { success: false, error: 'Anda sudah melakukan check-in hari ini' },
        { status: 409 }
      )
    }

    const address = await reverseGeocode(lat, lng)

    const buffer = Buffer.from(await image.arrayBuffer())
    const { webViewLink } = await uploadToDrive(
      buffer,
      `checkin_${user.id}_${Date.now()}.jpg`,
      image.type
    )

    const now = new Date().toISOString()

    const { data: newAttendance, error: dbError } = await supabase
      .from('attendance')
      .insert({
        user_id: user.id,
        date: todayStr,
        keterangan,
        check_in_time: now,
        check_in_lat: lat,
        check_in_lng: lng,
        check_in_address: address,
        check_in_image_url: webViewLink,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Gagal mencatat presensi: ' + dbError.message },
        { status: 500 }
      )
    }

    // Catatan: notifikasi WA TIDAK dikirim di sini.
    // WA hanya dikirim sekali sehari lewat cron job (lihat app/api/cron/daily-recap/route.ts)

    const quote = getRandomQuote()

    return NextResponse.json({
      success: true,
      data: {
        checkInTime: now,
        address,
        imageUrl: webViewLink,
      },
      attendance: newAttendance,
      quote,
    })
  } catch (error: any) {
    console.error('Error during check-in:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
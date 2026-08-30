import { createClient } from '@/lib/supabase/server'
import { reverseGeocode } from '@/lib/geocode'
import { getRandomQuote } from '@/lib/quotes'
import { NextRequest, NextResponse } from 'next/server'

const VALID_KETERANGAN = ['Hadir', 'Izin', 'WFA/WFH']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const keterangan = body.keterangan as string

    if (!keterangan || !VALID_KETERANGAN.includes(keterangan)) {
      return NextResponse.json({ success: false, error: 'Keterangan wajib dipilih' }, { status: 400 })
    }

    const isIzin = keterangan === 'Izin'

    // Lokasi cuma wajib kalau BUKAN izin
    let lat: number | null = null
    let lng: number | null = null
    let address: string | null = null

    if (!isIzin) {
      lat = parseFloat(body.lat)
      lng = parseFloat(body.lng)

      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ success: false, error: 'Lokasi tidak valid' }, { status: 400 })
      }
      address = await reverseGeocode(lat, lng)
    }

    const today = new Date()
    const offset = today.getTimezoneOffset()
    const localDate = new Date(today.getTime() - offset * 60 * 1000)
    const todayStr = localDate.toISOString().split('T')[0]

    const { data: existingCheck } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle()

    if (existingCheck) {
      return NextResponse.json(
        { success: false, error: 'Anda sudah melakukan presensi hari ini' },
        { status: 409 }
      )
    }

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
        // Kalau izin, langsung tandai check-out juga di waktu yang sama
        // biar sistem tau hari ini "selesai", gak perlu tunggu checkout manual
        ...(isIzin && { check_out_time: now }),
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json(
        { success: false, error: 'Gagal mencatat presensi: ' + dbError.message },
        { status: 500 }
      )
    }

    const quote = getRandomQuote()

    return NextResponse.json({
      success: true,
      data: { checkInTime: now, address, isIzin },
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
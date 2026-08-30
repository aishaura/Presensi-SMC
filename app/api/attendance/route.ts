import { createClient } from '@/lib/supabase/server'
import { uploadToDrive } from '@/lib/google-drive'
import { reverseGeocode } from '@/lib/geocode'
import { getRandomQuote } from '@/lib/quotes'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const lat = parseFloat(formData.get('lat') as string)
    const lng = parseFloat(formData.get('lng') as string)
    const image = formData.get('image') as File

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ success: false, error: 'Lokasi tidak valid' }, { status: 400 })
    }
    if (!image) {
      return NextResponse.json({ success: false, error: 'Foto bukti progres wajib diunggah' }, { status: 400 })
    }

    const today = new Date()
    const offset = today.getTimezoneOffset()
    const localDate = new Date(today.getTime() - offset * 60 * 1000)
    const todayStr = localDate.toISOString().split('T')[0]

    const { data: existing, error: fetchError } = await supabase
      .from('attendance')
      .select('id, keterangan, check_in_time, check_out_time')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Kamu belum check-in hari ini' },
        { status: 400 }
      )
    }
    if (existing.keterangan === 'Izin') {
      return NextResponse.json(
        { success: false, error: 'Check-out tidak berlaku untuk status Izin' },
        { status: 400 }
      )
    }
    if (existing.check_out_time) {
      return NextResponse.json(
        { success: false, error: 'Kamu sudah check-out hari ini' },
        { status: 409 }
      )
    }

    const address = await reverseGeocode(lat, lng)

    const buffer = Buffer.from(await image.arrayBuffer())
    const { webViewLink } = await uploadToDrive(
      buffer,
      `checkout_${user.id}_${Date.now()}.jpg`,
      image.type
    )

    const now = new Date().toISOString()

    const { error } = await supabase
      .from('attendance')
      .update({
        check_out_time: now,
        check_out_lat: lat,
        check_out_lng: lng,
        check_out_address: address,
        check_out_image_url: webViewLink,
      })
      .eq('id', existing.id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    const quote = getRandomQuote()

    return NextResponse.json({
      success: true,
      data: { checkOutTime: now, address, imageUrl: webViewLink },
      quote,
    })
  } catch (err: any) {
    console.error('Check-out error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
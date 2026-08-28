import { createClient } from '@/lib/supabase/server'
import { uploadToDrive } from '@/lib/google-drive'
import { reverseGeocode } from '@/lib/geocode'
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
    const keterangan = formData.get('keterangan') as string
    const image = formData.get('image') as File

    if (!lat || !lng || !keterangan || !image) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await image.arrayBuffer())
    const address = await reverseGeocode(lat, lng)
    const { webViewLink } = await uploadToDrive(
      buffer,
      `checkin_${user.id}_${Date.now()}.jpg`,
      image.type
    )

    const now = new Date().toISOString()
    const today = now.split('T')[0]

    const { error } = await supabase.from('attendance').insert({
      user_id: user.id,
      date: today,
      keterangan,
      check_in_time: now,
      check_in_lat: lat,
      check_in_lng: lng,
      check_in_address: address,
      check_in_image_url: webViewLink,
    })

    if (error) {
      // Kalau error karena duplicate (sudah check-in hari ini)
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Kamu sudah check-in hari ini' },
          { status: 409 }
        )
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: { checkInTime: now, address, imageUrl: webViewLink },
    })
  } catch (err) {
    console.error('Check-in error:', err)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
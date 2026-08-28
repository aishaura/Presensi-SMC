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
    const image = formData.get('image') as File | null

    const today = new Date().toISOString().split('T')[0]

    // Cek dulu udah check-in belum hari ini
    const { data: existing, error: fetchError } = await supabase
      .from('attendance')
      .select('id, check_in_time, check_out_time')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Kamu belum check-in hari ini' },
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
    let imageUrl: string | undefined

    if (image) {
      const buffer = Buffer.from(await image.arrayBuffer())
      const uploaded = await uploadToDrive(
        buffer,
        `checkout_${user.id}_${Date.now()}.jpg`,
        image.type
      )
      imageUrl = uploaded.webViewLink
    }

    const now = new Date().toISOString()

    const { error } = await supabase
      .from('attendance')
      .update({
        check_out_time: now,
        check_out_lat: lat,
        check_out_lng: lng,
        check_out_address: address,
        check_out_image_url: imageUrl,
      })
      .eq('id', existing.id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: { checkOutTime: now, address, imageUrl },
    })
  } catch (err) {
    console.error('Check-out error:', err)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
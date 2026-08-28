import { createClient } from '@/lib/supabase/server'
import { reverseGeocode } from '@/lib/geocode'
import { getRandomQuote } from '@/lib/quotes'
import { uploadToGoogleDrive } from '@/lib/google-drive'
import { sendWhatsAppNotification } from '@/lib/whatsapp'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const lat = parseFloat(formData.get('latitude') as string)
    const lng = parseFloat(formData.get('longitude') as string)
    const photo = formData.get('photo') as File | null

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Data koordinat tidak valid' }, { status: 400 })
    }

    // Ambil tanggal local hari ini YYYY-MM-DD
    const today = new Date()
    const offset = today.getTimezoneOffset()
    const localDate = new Date(today.getTime() - offset * 60 * 1000)
    const todayStr = localDate.toISOString().split('T')[0]

    // Cek apakah sudah check-in hari ini (harus ada check-in dulu sebelum check-out)
    const { data: existingCheck } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle()

    if (!existingCheck) {
      return NextResponse.json({ error: 'Anda belum melakukan check-in hari ini' }, { status: 400 })
    }

    if (existingCheck.check_out_time) {
      return NextResponse.json({ error: 'Anda sudah melakukan check-out hari ini' }, { status: 400 })
    }

    // Reverse Geocoding untuk lokasi check-out
    const address = await reverseGeocode(lat, lng)

    let imageUrl = null

    // Upload foto progres check-out jika ada
    if (photo && photo.size > 0) {
      const arrayBuffer = await photo.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const fileExtension = photo.name.split('.').pop() || 'jpg'
      const fileName = `${user.id}/${todayStr}_check_out_${Date.now()}.${fileExtension}`

      // 1. Coba upload ke Google Drive (opsional)
      const driveUrl = await uploadToGoogleDrive(buffer, `${user.id}_checkout_${todayStr}.${fileExtension}`, photo.type)
      if (driveUrl) {
        imageUrl = driveUrl
      } else {
        // 2. Fallback upload ke Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attendance-photos')
          .upload(fileName, buffer, {
            contentType: photo.type,
            upsert: true,
          })

        if (uploadError) {
          console.error('Error uploading checkout photo to Supabase Storage:', uploadError)
          return NextResponse.json(
            { error: `Gagal mengunggah foto progres. Error: ${uploadError.message}` },
            { status: 500 }
          )
        }

        const { data: publicUrlData } = supabase.storage
          .from('attendance-photos')
          .getPublicUrl(fileName)

        imageUrl = publicUrlData.publicUrl
      }
    }

    // Update record attendance dengan data check-out
    const { data: updatedAttendance, error: dbError } = await supabase
      .from('attendance')
      .update({
        check_out_time: new Date().toISOString(),
        check_out_lat: lat,
        check_out_lng: lng,
        check_out_address: address,
        check_out_image_url: imageUrl,
      })
      .eq('id', existingCheck.id)
      .select()
      .single()

    if (dbError) {
      console.error('Database update error:', dbError)
      return NextResponse.json({ error: 'Gagal memperbarui data check-out: ' + dbError.message }, { status: 500 })
    }

    // Ambil profile user untuk nama dan no hp (untuk WA)
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, phone')
      .eq('id', user.id)
      .single()

    const userName = profile?.name || user.email || 'Karyawan'
    const waMessage = `Halo Admin, ${userName} baru saja melakukan CHECK OUT pada jam ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}. Lokasi: ${address}`
    
    // Kirim notifikasi WA (jika API token terkonfigurasi)
    const adminPhone = process.env.ADMIN_PHONE_NUMBER || ''
    if (adminPhone) {
      await sendWhatsAppNotification(adminPhone, waMessage)
    }

    const quote = getRandomQuote()

    return NextResponse.json({
      message: 'Check-out berhasil disimpan',
      attendance: updatedAttendance,
      quote,
    })
  } catch (error: any) {
    console.error('Error during check-out:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

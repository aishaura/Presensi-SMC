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
    const keterangan = formData.get('keterangan') as string
    const photo = formData.get('photo') as File

    if (isNaN(lat) || isNaN(lng) || !keterangan || !photo) {
      return NextResponse.json({ error: 'Data formulir tidak lengkap' }, { status: 400 })
    }

    // Ambil tanggal local hari ini YYYY-MM-DD
    const today = new Date()
    const offset = today.getTimezoneOffset()
    const localDate = new Date(today.getTime() - offset * 60 * 1000)
    const todayStr = localDate.toISOString().split('T')[0]

    // Cek apakah sudah check-in hari ini
    const { data: existingCheck } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle()

    if (existingCheck) {
      return NextResponse.json({ error: 'Anda sudah melakukan check-in hari ini' }, { status: 400 })
    }

    // Reverse Geocoding
    const address = await reverseGeocode(lat, lng)

    // Konversi file foto ke buffer
    const arrayBuffer = await photo.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileExtension = photo.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}/${todayStr}_check_in_${Date.now()}.${fileExtension}`

    let imageUrl = ''

    // 1. Coba upload ke Google Drive dulu jika terkonfigurasi (opsional)
    const driveUrl = await uploadToGoogleDrive(buffer, `${user.id}_checkin_${todayStr}.${fileExtension}`, photo.type)
    if (driveUrl) {
      imageUrl = driveUrl
    } else {
      // 2. Fallback upload ke Supabase Storage (bucket: attendance-photos)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attendance-photos')
        .upload(fileName, buffer, {
          contentType: photo.type,
          upsert: true,
        })

      if (uploadError) {
        console.error('Error uploading to Supabase Storage:', uploadError)
        return NextResponse.json(
          { error: `Gagal mengunggah foto. Pastikan bucket 'attendance-photos' sudah dibuat di Supabase Storage. Error: ${uploadError.message}` },
          { status: 500 }
        )
      }

      const { data: publicUrlData } = supabase.storage
        .from('attendance-photos')
        .getPublicUrl(fileName)

      imageUrl = publicUrlData.publicUrl
    }

    // Simpan ke tabel attendance
    const { data: newAttendance, error: dbError } = await supabase
      .from('attendance')
      .insert({
        user_id: user.id,
        date: todayStr,
        keterangan: keterangan,
        check_in_time: new Date().toISOString(),
        check_in_lat: lat,
        check_in_lng: lng,
        check_in_address: address,
        check_in_image_url: imageUrl,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: 'Gagal mencatat presensi di database: ' + dbError.message }, { status: 500 })
    }

    // Ambil profile user untuk nama dan no hp (untuk WA)
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, phone')
      .eq('id', user.id)
      .single()

    const userName = profile?.name || user.email || 'Karyawan'
    const waMessage = `Halo Admin, ${userName} baru saja melakukan CHECK IN (${keterangan}) pada jam ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}. Lokasi: ${address}`
    
    // Kirim notifikasi WA (jika API token terkonfigurasi, jika tidak dia cuma log mock di console)
    const adminPhone = process.env.ADMIN_PHONE_NUMBER || ''
    if (adminPhone) {
      await sendWhatsAppNotification(adminPhone, waMessage)
    }

    // Ambil Quote motivasi
    const quote = getRandomQuote()

    return NextResponse.json({
      message: 'Check-in berhasil disimpan',
      attendance: newAttendance,
      quote,
    })
  } catch (error: any) {
    console.error('Error during check-in:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

import AttendanceTable from '@/components/AttendanceTable'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const revalidate = 0 // Disable cache agar data HR selalu aktual

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Cek profile & role admin
  const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()

console.log('ADMIN DEBUG:', {
  userId: user.id,
  profile,
  profileError,
})

if (profile?.role !== 'admin') {
  redirect('/')
}

  // Ambil daftar karyawan/anak magang
  const { data: employees } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'employee')

  // Ambil tanggal local hari ini YYYY-MM-DD
  const today = new Date()
  const offset = today.getTimezoneOffset()
  const localDate = new Date(today.getTime() - offset * 60 * 1000)
  const todayStr = localDate.toISOString().split('T')[0]

  // Ambil rekap kehadiran hari ini
  const { data: todayRecords } = await supabase
    .from('attendance')
    .select('id, keterangan')
    .eq('date', todayStr)

  // Hitung statistik hari ini
  const totalEmployees = employees?.length || 0
  const todayCheckedInCount = todayRecords?.length || 0
  
  let countHadir = 0
  let countWfhWfa = 0
  let countIzin = 0

  todayRecords?.forEach((rec) => {
    if (rec.keterangan === 'Hadir') {
      countHadir++
    } else if (rec.keterangan === 'WFH/WFA') {
      countWfhWfa++
    } else if (rec.keterangan?.startsWith('Izin')) {
      countIzin++
    }
  })

  const countBelumPresensi = Math.max(0, totalEmployees - todayCheckedInCount)

  // Ambil semua riwayat kehadiran beserta data profil karyawan untuk diumpankan ke tabel rekap
  const { data: records, error } = await supabase
  .from('attendance')
  .select(`
    id,
    date,
    keterangan,
    check_in_time,
    check_in_lat,
    check_in_lng,
    check_in_address,
    check_in_image_url,
    check_out_time,
    check_out_lat,
    check_out_lng,
    check_out_address,
    check_out_image_url,
    profiles!attendance_user_id_fkey (
      name,
      phone
    )
  `)
  .order('date', { ascending: false })
  .order('check_in_time', { ascending: false })

  if (error) {
    console.error('Error loading attendance for admin:', error)
  }

  const mappedRecords = (records || []).map((rec: any) => {
    const rawProfile = rec.profiles || rec['profiles!attendance_user_id_fkey']
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile
    return {
      ...rec,
      profiles: {
        name: profile?.name || 'Magang',
        phone: profile?.phone || null,
      },
    }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Rekap Presensi Karyawan</h2>
        <p className="text-sm text-gray-500">
          Selamat datang di Panel HRD Saung Mirza Community. Memantau kehadiran anak magang.
        </p>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Magang */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Anak Magang</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{totalEmployees}</span>
            <span className="text-xs text-gray-500">orang</span>
          </div>
        </div>

        {/* Hadir & WFH/WFA */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hadir / WFH-WFA</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-green-600">
              {countHadir + countWfhWfa}
            </span>
            <span className="text-xs text-gray-500">
              ({countHadir} Hadir / {countWfhWfa} WFH)
            </span>
          </div>
        </div>

        {/* Izin */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Izin Hari Ini</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{countIzin}</span>
            <span className="text-xs text-gray-500">orang</span>
          </div>
        </div>

        {/* Belum Check In */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Belum Presensi</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600">{countBelumPresensi}</span>
            <span className="text-xs text-gray-500">orang</span>
          </div>
        </div>
      </div>

      {/* Tabel & Rekap Utama */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Log Presensi Keseluruhan</h3>
        <AttendanceTable initialRecords={mappedRecords} />
      </div>
    </div>
  )
}

import AttendanceTable from '@/components/AttendanceTable'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const { data: employees } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'employee')

  const today = new Date()
  const offset = today.getTimezoneOffset()
  const localDate = new Date(today.getTime() - offset * 60 * 1000)
  const todayStr = localDate.toISOString().split('T')[0]

  const { data: todayRecords } = await supabase
    .from('attendance')
    .select('id, keterangan')
    .eq('date', todayStr)

  const totalEmployees = employees?.length || 0
  const todayCheckedInCount = todayRecords?.length || 0

  let countHadir = 0
  let countWfaWfh = 0
  let countIzin = 0

  todayRecords?.forEach((rec) => {
    if (rec.keterangan === 'Hadir') {
      countHadir++
    } else if (rec.keterangan === 'WFA/WFH') {
      countWfaWfh++
    } else if (rec.keterangan === 'Izin') {
      countIzin++
    }
  })

  const countBelumPresensi = Math.max(0, totalEmployees - todayCheckedInCount)

  // Ambil semua riwayat kehadiran — sinkron dengan kolom yang benar-benar dipakai
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
      check_out_time,
      check_out_lat,
      check_out_lng,
      check_out_address,
      check_out_image_url,
      progress_note,
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
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Rekap Presensi Karyawan</h2>
        <p className="text-sm text-gray-500">
          Selamat datang di Panel HRD Saung Mirza Community. Memantau kehadiran anak magang.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Anak Magang</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{totalEmployees}</span>
            <span className="text-xs text-gray-500">orang</span>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hadir / WFA-WFH</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-green-600">
              {countHadir + countWfaWfh}
            </span>
            <span className="text-xs text-gray-500">
              ({countHadir} Hadir / {countWfaWfh} WFA-WFH)
            </span>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Izin Hari Ini</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{countIzin}</span>
            <span className="text-xs text-gray-500">orang</span>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Belum Presensi</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600">{countBelumPresensi}</span>
            <span className="text-xs text-gray-500">orang</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Log Presensi Keseluruhan</h3>
        <AttendanceTable initialRecords={mappedRecords} />
      </div>
    </div>
  )
}
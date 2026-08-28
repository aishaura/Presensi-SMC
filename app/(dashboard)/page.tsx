import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DigitalClock from '@/components/DigitalClock'
import AttendanceButton from '@/components/AttendanceButton'

export const revalidate = 0 // Disable cache agar status presensi selalu up-to-date

export default async function EmployeeDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ambil profil user
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Redirect admin ke halaman rekap admin
  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  // Dapatkan tanggal local hari ini YYYY-MM-DD
  const today = new Date()
  const offset = today.getTimezoneOffset()
  const localDate = new Date(today.getTime() - offset * 60 * 1000)
  const todayStr = localDate.toISOString().split('T')[0]

  // Ambil presensi hari ini
  const { data: attendance } = await supabase
    .from('attendance')
    .select('id, keterangan, check_in_time, check_in_address, check_out_time, check_out_address')
    .eq('user_id', user.id)
    .eq('date', todayStr)
    .maybeSingle()

  // Handler reload halaman di client-side menggunakan Server Action (kita panggil revalidatePath di backend,
  // atau trigger reload window di client)
  const refreshPage = async () => {
    'use server'
    // Refresh otomatis via route revalidation
  }

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-'
    return new Date(isoString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      {/* Welcome Message */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Halo, {profile?.name || 'Anak Magang'}!</h2>
        <p className="text-sm text-gray-500">Selamat datang di Panel Presensi Saung Mirza Community.</p>
      </div>

      {/* Clock Panel */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
        <DigitalClock />
      </div>

      {/* Attendance Action Button */}
      <AttendanceButton
        todayAttendance={attendance}
        onRefresh={refreshPage} // Di client kita override untuk window.location.reload()
      />

      {/* Today's Presensi Summary */}
      {attendance && (
        <div className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Rincian Hari Ini</h3>
          
          <div className="grid grid-cols-1 gap-4 divide-y divide-gray-100">
            {/* Check In Detail */}
            <div className="pt-2 first:pt-0 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Check In</span>
                <span className="font-semibold text-blue-600">{formatTime(attendance.check_in_time)}</span>
              </div>
              <div className="text-xs text-gray-400 leading-relaxed">
                Lokasi: {attendance.check_in_address || 'Tidak terdeteksi'}
              </div>
              <div className="text-xs text-gray-400">
                Keterangan: <span className="font-semibold text-gray-700">{attendance.keterangan}</span>
              </div>
            </div>

            {/* Check Out Detail */}
            <div className="pt-4 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Check Out</span>
                <span className="font-semibold text-orange-600">
                  {attendance.check_out_time ? formatTime(attendance.check_out_time) : 'Belum Check Out'}
                </span>
              </div>
              {attendance.check_out_time && (
                <div className="text-xs text-gray-400 leading-relaxed">
                  Lokasi: {attendance.check_out_address || 'Tidak terdeteksi'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guide Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-2">
        <h4 className="text-sm font-semibold text-blue-800">Petunjuk Presensi:</h4>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Pastikan GPS/Akses Lokasi browser diaktifkan dan diizinkan.</li>
          <li>Ambil foto selfie/bukti kehadiran yang jelas saat Check-in.</li>
          <li>Unggah foto progres atau dokumentasi tugas saat Check-out.</li>
          <li>Jika ada kendala presensi, segera hubungi Admin/HR.</li>
        </ul>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const revalidate = 0 // Disable cache agar riwayat selalu fresh

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ambil riwayat presensi user ini
  const { data: records, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching history:', error)
  }

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-'
    return new Date(isoString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Riwayat Presensi</h2>
        <p className="text-sm text-gray-500">Daftar kehadiran Anda di Saung Mirza Community.</p>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-bold text-gray-800 uppercase tracking-wider">
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y text-gray-600">
              {!records || records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-650 font-medium">
                    Belum ada riwayat presensi tercatat.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatDate(rec.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          rec.keterangan.startsWith('Izin')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : rec.keterangan === 'WFH/WFA'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}
                      >
                        {rec.keterangan}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="font-bold text-gray-900">{formatTime(rec.check_in_time)}</div>
                      <div className="text-xs text-gray-650 font-semibold max-w-50 truncate" title={rec.check_in_address || ''}>
                        {rec.check_in_address || '-'}
                      </div>
                      {rec.check_in_image_url && (
                        <a
                          href={rec.check_in_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-xs text-blue-600 hover:underline"
                        >
                          Lihat Foto Bukti
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      {rec.check_out_time ? (
                        <>
                          <div className="font-bold text-gray-900">{formatTime(rec.check_out_time)}</div>
                          <div className="text-xs text-gray-650 font-semibold max-w-50 truncate" title={rec.check_out_address || ''}>
                            {rec.check_out_address || '-'}
                          </div>
                          {rec.check_out_image_url && (
                            <a
                              href={rec.check_out_image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-xs text-blue-600 hover:underline"
                            >
                              Lihat Foto Progres
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-650 font-bold italic">Belum Check-out</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

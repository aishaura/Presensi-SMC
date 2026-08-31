import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProgressDetailModal from './ProgresDetailModal'

export const revalidate = 0

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">
          Riwayat Presensi
        </h2>

        <p className="text-sm text-gray-500">
          Daftar kehadiran Anda di Saung Mirza Community.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-bold text-gray-800 uppercase tracking-wider">
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Progress</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="text-sm divide-y text-gray-600">
              {!records || records.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500 font-medium"
                  >
                    Belum ada riwayat presensi tercatat.
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const isIzin = rec.keterangan === 'Izin'
                  const isWfaWfh = rec.keterangan === 'WFA/WFH' || rec.keterangan === 'WFH/WFA'

                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/50">
                      {/* Tanggal */}
                      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {formatDate(rec.date)}
                      </td>

                      {/* Keterangan */}
                      <td className="px-6 py-4">
                        <span
                          className={
                            isIzin
                              ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200'
                              : isWfaWfh
                                ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200'
                                : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200'
                          }
                        >
                          {rec.keterangan}
                        </span>
                      </td>

                      {/* Check In */}
                      <td className="px-6 py-4 space-y-1">
                        <div className="font-bold text-gray-900">
                          {formatTime(rec.check_in_time)}
                        </div>

                        {!isIzin && (
                          <div
                            className="text-xs text-gray-500 font-medium max-w-50 truncate"
                            title={rec.check_in_address || ''}
                          >
                            {rec.check_in_address || '-'}
                          </div>
                        )}
                      </td>

                      {/* Check Out */}
                      <td className="px-6 py-4 space-y-1">
                        {isIzin ? (
                          <span className="text-xs text-gray-400 italic">
                            Tidak ada check-out (Izin)
                          </span>
                        ) : rec.check_out_time ? (
                          <>
                            <div className="font-bold text-gray-900">
                              {formatTime(rec.check_out_time)}
                            </div>

                            <div
                              className="text-xs text-gray-500 font-medium max-w-50 truncate"
                              title={rec.check_out_address || ''}
                            >
                              {rec.check_out_address || '-'}
                            </div>

                            {/* Foto Progress */}
                            {rec.check_out_image_url ? (
                              <a
                                href={rec.check_out_image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-xs text-blue-600 hover:underline"
                              >
                                Lihat Foto Progres
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400">
                                Tidak ada foto
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-500 font-semibold italic">
                            Belum Check-out
                          </span>
                        )}
                      </td>

                      {/* Progress */}
                      <td className="px-6 py-4">
                        {isIzin ? (
                          <span className="text-xs text-gray-400 italic">
                            -
                          </span>
                        ) : rec.progress_note ? (
                          <div className="space-y-1">
                            {/* Preview progress */}
                            <div
                              className="max-w-52 truncate text-sm text-gray-700"
                              title={rec.progress_note}
                            >
                              {rec.progress_note}
                            </div>

                            {/* Tombol popup */}
                            <ProgressDetailModal
                              progressNote={rec.progress_note}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Belum ada catatan
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGeolocation } from '@/hooks/useGeolocation'
import KeteranganSelect from './KeteranganSelect'
import ImageUploader from './ImageUploader'
import QuoteCard from './QuoteCard'

interface AttendanceButtonProps {
  todayAttendance: {
    id: string
    keterangan: string
    check_in_time: string
    check_out_time: string | null
  } | null
  onRefresh?: () => void
}

export default function AttendanceButton({
  todayAttendance,
  onRefresh,
}: AttendanceButtonProps) {
  const router = useRouter()
  const { loading: geoLoading, error: geoError, getLocation } = useGeolocation()
  const [showModal, setShowModal] = useState(false)
  const [keterangan, setKeterangan] = useState('Hadir')
  const [alasanIzin, setAlasanIzin] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ quote: string; message: string } | null>(null)

  // Status Presensi hari ini
  const isCheckedIn = !!todayAttendance
  const isCheckedOut = !!todayAttendance?.check_out_time

  const handleActionClick = async () => {
    setError(null)
    setSuccessData(null)
    try {
      await getLocation()
      setShowModal(true)
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Gagal mendeteksi lokasi Anda. Pastikan GPS aktif dan izin diberikan.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!photo && !isCheckedIn) {
      setError('Foto bukti check-in wajib diunggah')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const coords = await getLocation()

      const formData = new FormData()
      formData.append('latitude', coords.lat.toString())
      formData.append('longitude', coords.lng.toString())

      if (photo) {
        formData.append('photo', photo)
      }

      let url = '/api/attendance/check-in'
      if (!isCheckedIn) {
        const finalKeterangan = keterangan === 'Izin' ? `Izin: ${alasanIzin}` : keterangan
        formData.append('keterangan', finalKeterangan)
      } else {
        url = '/api/attendance/check-out'
      }

      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem')
      }

      setSuccessData({
        quote: data.quote || 'Selamat melanjutkan hari!',
        message: isCheckedIn ? 'Berhasil melakukan Check Out!' : 'Berhasil melakukan Check In!',
      })
      setShowModal(false)
      setPhoto(null)
      setKeterangan('Hadir')
      setAlasanIzin('')
      router.refresh()
      if (onRefresh) onRefresh()
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim data presensi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Notifikasi Sukses + Quote */}
      {successData && (
        <div className="space-y-4 transition-all duration-300">
          <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-sm rounded-xl p-4 flex items-center justify-between shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-emerald-500 rounded-full text-white shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-medium text-emerald-950">{successData.message}</span>
            </div>
            <button
              onClick={() => setSuccessData(null)}
              className="text-emerald-500 hover:text-emerald-800 p-1 rounded-lg hover:bg-emerald-100 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <QuoteCard quote={successData.quote} />
        </div>
      )}

      {/* Pesan Error */}
      {error && (
        <div className="bg-rose-50/90 border border-rose-200 text-rose-900 text-sm rounded-xl p-4 flex items-center justify-between shadow-sm transition-all">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-rose-500 rounded-full text-white shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-100 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Button & Status Area Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-base font-semibold text-gray-800 tracking-tight">Panel Presensi</h2>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isCheckedOut
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : isCheckedIn
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-slate-100 text-slate-600'
            }`}>
            <span className={`w-2 h-2 rounded-full ${isCheckedOut ? 'bg-emerald-500 animate-pulse' : isCheckedIn ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
              }`} />
            {isCheckedOut ? 'Selesai' : isCheckedIn ? 'Sudah Check In' : 'Belum Presensi'}
          </span>
        </div>

        {isCheckedOut ? (
          <div className="py-6 space-y-3">
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-gray-900 font-semibold text-base">Presensi Hari Ini Selesai!</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Terima kasih atas kontribusinya hari ini. Seluruh alur check-in dan check-out telah terekam.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-5">
            <button
              onClick={handleActionClick}
              disabled={geoLoading || loading}
              className={`w-full sm:max-w-xs mx-auto py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-md flex items-center justify-center gap-2.5 active:scale-[0.98] ${isCheckedIn
                  ? 'bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/20'
                  : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {geoLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Mendeteksi Lokasi...</span>
                </>
              ) : isCheckedIn ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Check Out Now</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Check In Now</span>
                </>
              )}
            </button>

            {geoError && (
              <p className="text-xs text-rose-500 font-medium bg-rose-50 py-2 px-3 rounded-lg border border-rose-100 inline-block">
                {geoError}
              </p>
            )}

            <div className="text-xs text-gray-500 bg-gray-50/80 rounded-xl p-3 border border-gray-100">
              {!isCheckedIn ? (
                <p>Klik tombol di atas untuk memverifikasi GPS dan mengisi bukti kehadiran.</p>
              ) : (
                <p>
                  Terverifikasi Check In pada pukul{' '}
                  <span className="font-semibold text-gray-700">
                    {new Date(todayAttendance.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulir Presensi */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-gray-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-base">
                  Formulir {!isCheckedIn ? 'Check In' : 'Check Out'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Lengkapi data presensi harian Anda</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {!isCheckedIn ? (
                <>
                  <KeteranganSelect
                    value={keterangan}
                    onChange={setKeterangan}
                    reasonValue={alasanIzin}
                    onReasonChange={setAlasanIzin}
                  />
                  <ImageUploader
                    label="Unggah Foto Selfie / Bukti Kehadiran"
                    onChange={setPhoto}
                    required={true}
                  />
                </>
              ) : (
                <ImageUploader
                  label="Unggah Foto Progres Akhir Hari (Opsional)"
                  onChange={setPhoto}
                  required={false}
                />
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition active:scale-[0.99]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Kirim Presensi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
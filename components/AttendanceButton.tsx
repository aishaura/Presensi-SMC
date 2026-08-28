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
      // Ambil lokasi terlebih dahulu
      await getLocation()
      // Buka modal isian setelah lokasi berhasil didapatkan
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
      // Re-fetch lokasi terbaru sebelum submit untuk memastikan koordinat akurat
      const coords = await getLocation()

      const formData = new FormData()
      formData.append('latitude', coords.latitude.toString())
      formData.append('longitude', coords.longitude.toString())
      
      if (photo) {
        formData.append('photo', photo)
      }

      let url = '/api/attendance/check-in'
      if (!isCheckedIn) {
        // Proses Check-in
        const finalKeterangan = keterangan === 'Izin' ? `Izin: ${alasanIzin}` : keterangan
        formData.append('keterangan', finalKeterangan)
      } else {
        // Proses Check-out
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
    <div className="space-y-6">
      {/* Notifikasi Sukses + Quote */}
      {successData && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{successData.message}</span>
            </div>
            <button onClick={() => setSuccessData(null)} className="text-green-600 hover:text-green-800 font-bold text-lg leading-none">&times;</button>
          </div>
          <QuoteCard quote={successData.quote} />
        </div>
      )}

      {/* Pesan Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 font-bold text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Button & Status Area */}
      <div className="bg-white border rounded-2xl p-6 text-center space-y-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Panel Presensi</h2>
        
        {isCheckedOut ? (
          <div className="py-6 space-y-2">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-800 font-medium">Presensi Hari ini Selesai!</p>
            <p className="text-xs text-gray-500">Anda sudah melakukan check-in dan check-out untuk hari ini.</p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <button
              onClick={handleActionClick}
              disabled={geoLoading || loading}
              className={`w-full max-w-xs mx-auto py-3.5 px-6 rounded-xl font-semibold text-white transition shadow-md flex items-center justify-center gap-2 ${
                isCheckedIn
                  ? 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                <span>Check Out</span>
              ) : (
                <span>Check In</span>
              )}
            </button>

            {geoError && (
              <p className="text-xs text-red-500 font-medium mt-2">{geoError}</p>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              {!isCheckedIn ? (
                <p>Klik tombol untuk meminta izin lokasi dan mengisi form check-in.</p>
              ) : (
                <p>Status: Sudah Check In jam {new Date(todayAttendance.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulir Presensi */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Formulir {!isCheckedIn ? 'Check In' : 'Check Out'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
              <div className="pt-4 flex items-center gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5"
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

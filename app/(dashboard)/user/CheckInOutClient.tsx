'use client'

import { useState } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { Attendance, Keterangan } from '@/types'

interface Props {
  initialAttendance: Attendance | null
}

const KETERANGAN_OPTIONS: Keterangan[] = ['Hadir', 'Izin', 'WFA/WFH']

export default function CheckInOutClient({ initialAttendance }: Props) {
  const [attendance, setAttendance] = useState<Attendance | null>(initialAttendance)
  const [keterangan, setKeterangan] = useState<Keterangan>('Hadir')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quote, setQuote] = useState<string | null>(null)

  const { getLocation, loading: geoLoading, error: geoError } = useGeolocation()

  const hasCheckedIn = !!attendance?.check_in_time
  const hasCheckedOut = !!attendance?.check_out_time
  const isIzin = attendance?.keterangan === 'Izin'

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleCheckIn() {
    setError(null)
    setSubmitting(true)
    try {
      const isIzinPick = keterangan === 'Izin'
      let lat: number | undefined
      let lng: number | undefined

      if (!isIzinPick) {
        const loc = await getLocation()
        lat = loc.lat
        lng = loc.lng
      }

      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keterangan, lat, lng }),
      })
      const result = await res.json()

      if (!result.success) {
        setError(result.error || 'Terjadi kesalahan')
        return
      }

      setAttendance(result.attendance)
      setQuote(result.quote ?? null)
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil lokasi')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCheckOut() {
    setError(null)
    if (!imageFile) {
      setError('Foto bukti progres wajib diunggah')
      return
    }

    setSubmitting(true)
    try {
      const { lat, lng } = await getLocation()

      const formData = new FormData()
      formData.append('lat', String(lat))
      formData.append('lng', String(lng))
      formData.append('image', imageFile)

      const res = await fetch('/api/attendance/check-out', { method: 'POST', body: formData })
      const result = await res.json()

      if (!result.success) {
        setError(result.error || 'Terjadi kesalahan')
        return
      }

      setAttendance((prev) =>
        prev
          ? {
              ...prev,
              check_out_time: result.data.checkOutTime,
              check_out_address: result.data.address,
              check_out_image_url: result.data.imageUrl,
            }
          : prev
      )
      setQuote(result.quote ?? null)
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil lokasi')
    } finally {
      setSubmitting(false)
    }
  }

  // Kasus 1: Izin — selesai begitu check-in, gak ada checkout
  if (hasCheckedIn && isIzin) {
    return (
      <div className="bg-white border rounded-2xl shadow-sm p-6 text-center space-y-3">
        <div className="text-4xl">📝</div>
        <h3 className="font-semibold text-lg text-gray-900">Izin tercatat</h3>
        <p className="text-sm text-gray-500">
          Kamu mengajukan izin hari ini pukul{' '}
          {new Date(attendance!.check_in_time!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {quote && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 italic mt-4">
            "{quote}"
          </div>
        )}
      </div>
    )
  }

  // Kasus 2: Hadir/WFA-WFH, sudah check-in dan check-out — selesai
  if (hasCheckedIn && hasCheckedOut) {
    return (
      <div className="bg-white border rounded-2xl shadow-sm p-6 text-center space-y-3">
        <div className="text-4xl">✅</div>
        <h3 className="font-semibold text-lg text-gray-900">Presensi hari ini selesai</h3>
        <p className="text-sm text-gray-500">
          {attendance?.keterangan} · In: {new Date(attendance!.check_in_time!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          {' · '}
          Out: {new Date(attendance!.check_out_time!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {quote && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 italic mt-4">
            "{quote}"
          </div>
        )}
      </div>
    )
  }

  // Kasus 3: Belum check-in sama sekali — pilih keterangan dulu
  if (!hasCheckedIn) {
    return (
      <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {geoError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {geoError}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Keterangan
          </label>
          <div className="grid grid-cols-3 gap-2">
            {KETERANGAN_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setKeterangan(opt)}
                className={`py-2.5 rounded-lg text-xs font-medium border transition ${
                  keterangan === opt
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {keterangan !== 'Izin' && (
          <p className="text-xs text-gray-400 text-center">
            Lokasi kamu akan diambil otomatis saat check-in.
          </p>
        )}

        <button
          onClick={handleCheckIn}
          disabled={submitting || geoLoading}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {(submitting || geoLoading) && (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {geoLoading ? 'Mengambil lokasi...' : submitting ? 'Memproses...' : 'Check In'}
        </button>
      </div>
    )
  }

  // Kasus 4: Sudah check-in (Hadir/WFA-WFH), belum check-out
  return (
    <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-5">
      <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-800">
        {attendance?.keterangan} · Check-in pukul{' '}
        {new Date(attendance!.check_in_time!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
      </div>

      {quote && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 italic">
          "{quote}"
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {geoError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {geoError}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Foto Bukti Progres Hari Ini
        </label>
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border" />
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null) }}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition">
            <span className="text-gray-400 text-sm">Ketuk untuk unggah foto</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">Lokasi kamu akan diambil otomatis saat check-out.</p>

      <button
        type="button"
        onClick={handleCheckOut}
        disabled={submitting || geoLoading}
        className="w-full py-2.5 rounded-lg text-white text-sm font-medium bg-orange-500 hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {(submitting || geoLoading) && (
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {geoLoading ? 'Mengambil lokasi...' : submitting ? 'Mengirim...' : 'Check Out'}
      </button>
    </div>
  )
}
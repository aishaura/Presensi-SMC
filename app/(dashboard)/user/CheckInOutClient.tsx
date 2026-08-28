'use client'

import { useState } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { Attendance, Keterangan } from '@/types'

interface Props {
  initialAttendance: Attendance | null
}

const KETERANGAN_OPTIONS: Keterangan[] = ['Hadir', 'Izin', 'WFA', 'WFH']

export default function CheckInOutClient({ initialAttendance }: Props) {
  const [attendance, setAttendance] = useState<Attendance | null>(initialAttendance)
  const [step, setStep] = useState<'idle' | 'form'>('idle')
  const [keterangan, setKeterangan] = useState<Keterangan>('Hadir')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quote, setQuote] = useState<string | null>(null)

  const { getLocation, loading: geoLoading, error: geoError } = useGeolocation()

  const hasCheckedIn = !!attendance?.check_in_time
  const hasCheckedOut = !!attendance?.check_out_time
  const mode: 'check-in' | 'check-out' | 'done' = !hasCheckedIn
    ? 'check-in'
    : !hasCheckedOut
    ? 'check-out'
    : 'done'

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function resetForm() {
    setStep('idle')
    setImageFile(null)
    setImagePreview(null)
    setKeterangan('Hadir')
    setError(null)
  }

  async function handleSubmit() {
    setError(null)

    if (mode === 'check-in' && !imageFile) {
      setError('Foto bukti wajib diunggah')
      return
    }

    setSubmitting(true)

    try {
      const { lat, lng } = await getLocation()

      const formData = new FormData()
      formData.append('lat', String(lat))
      formData.append('lng', String(lng))

      if (mode === 'check-in') {
        formData.append('keterangan', keterangan)
        formData.append('image', imageFile as File)
      } else {
        if (imageFile) formData.append('image', imageFile)
      }

      const endpoint = mode === 'check-in' ? '/api/attendance/check-in' : '/api/attendance/check-out'
      const res = await fetch(endpoint, { method: 'POST', body: formData })
      const result = await res.json()

      if (!result.success) {
        setError(result.error || 'Terjadi kesalahan')
        setSubmitting(false)
        return
      }

      if (mode === 'check-in') {
        setAttendance((prev) => ({
          ...(prev as Attendance),
          id: result.attendance?.id ?? prev?.id ?? '',
          user_id: result.attendance?.user_id ?? '',
          date: result.attendance?.date ?? '',
          keterangan,
          check_in_time: result.data.checkInTime,
          check_in_address: result.data.address,
          check_in_image_url: result.data.imageUrl,
          check_out_time: null,
          check_out_address: null,
          check_out_image_url: null,
        } as Attendance))
        setQuote(result.quote ?? null)
      } else {
        setAttendance((prev) =>
          prev
            ? {
                ...prev,
                check_out_time: result.data.checkOutTime,
                check_out_address: result.data.address,
                check_out_image_url: result.data.imageUrl ?? prev.check_out_image_url,
              }
            : prev
        )
        setQuote(result.quote ?? null)
      }

      resetForm()
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil lokasi')
    } finally {
      setSubmitting(false)
    }
  }

  if (mode === 'done') {
    return (
      <div className="bg-white border rounded-2xl shadow-sm p-6 text-center space-y-3">
        <div className="text-4xl">✅</div>
        <h3 className="font-semibold text-lg text-gray-900">Presensi hari ini selesai</h3>
        <p className="text-sm text-gray-500">
          Check-in: {new Date(attendance!.check_in_time!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          {' · '}
          Check-out: {new Date(attendance!.check_out_time!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {quote && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 italic mt-4">
            "{quote}"
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-5">
      {/* Status ringkas */}
      {hasCheckedIn && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-800">
          Check-in pukul {new Date(attendance!.check_in_time!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {attendance?.keterangan}
        </div>
      )}

      {quote && step === 'idle' && (
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

      {step === 'idle' ? (
        <button
          onClick={() => setStep('form')}
          className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition ${
            mode === 'check-in' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {mode === 'check-in' ? 'Check In Sekarang' : 'Check Out Sekarang'}
        </button>
      ) : (
        <div className="space-y-4">
          {mode === 'check-in' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Keterangan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {KETERANGAN_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setKeterangan(opt)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition ${
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
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Foto Bukti Progres {mode === 'check-out' && '(opsional)'}
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="flex-1 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || geoLoading}
              className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                mode === 'check-in' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {(submitting || geoLoading) && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {geoLoading ? 'Mengambil lokasi...' : submitting ? 'Mengirim...' : 'Kirim'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
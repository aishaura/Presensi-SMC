'use client'

import { useState } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { Attendance, Keterangan } from '@/types'

interface Props {
  initialAttendance: Attendance | null
}

const KETERANGAN_OPTIONS: Keterangan[] = ['Hadir', 'Izin', 'WFA/WFH']
const MAX_NOTE_LENGTH = 500

export default function CheckInOutClient({ initialAttendance }: Props) {
  const [attendance, setAttendance] = useState<Attendance | null>(initialAttendance)
  const [keterangan, setKeterangan] = useState<Keterangan>('Hadir')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [progressNote, setProgressNote] = useState('')
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
    if (!progressNote.trim()) {
      setError('Keterangan progres wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const { lat, lng } = await getLocation()

      const formData = new FormData()
      formData.append('lat', String(lat))
      formData.append('lng', String(lng))
      formData.append('image', imageFile)
      formData.append('progressNote', progressNote.trim())

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
              progress_note: result.data.progressNote,
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

  // Kasus 1: Izin — selesai begitu check-in
  if (hasCheckedIn && isIzin) {
    return (
      <div className="bg-linear-to-b from-slate-900 to-slate-950 text-white rounded-3xl shadow-xl p-6 sm:p-8 text-center space-y-5 max-w-lg mx-auto relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <span className="text-3xl">📝</span>
        </div>
        <div>
          <h3 className="font-bold text-slate-100 text-lg sm:text-xl">Izin Tercatat</h3>
          <p className="text-xs text-slate-400 mt-1">
            Pengajuan izin berhasil pada pukul{' '}
            <span className="font-semibold text-amber-400">
              {new Date(attendance!.check_in_time!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </p>
        </div>
        {quote && (
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 text-xs text-slate-300 italic">
            "{quote}"
          </div>
        )}
      </div>
    )
  }

  // Kasus 2: Hadir/WFA-WFH, sudah check-in & check-out — selesai
  if (hasCheckedIn && hasCheckedOut) {
    return (
      <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl shadow-xl p-6 sm:p-8 text-center space-y-6 max-w-lg mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h3 className="font-bold text-slate-100 text-lg sm:text-xl">Presensi Hari Ini Selesai</h3>
          <div className="inline-flex items-center gap-2 mt-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs text-slate-300 font-medium">
            <span className="text-emerald-400 font-semibold">{attendance?.keterangan}</span>
            <span className="text-slate-600">•</span>
            <span>In: {new Date(attendance!.check_in_time!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-slate-600">•</span>
            <span>Out: {new Date(attendance!.check_out_time!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {attendance?.progress_note && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="p-1 rounded bg-blue-500/10 text-blue-400 text-xs">📝</span> Progres Hari Ini
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-300">
              {attendance.progress_note
                .split('\n')
                .filter((line) => line.trim() !== '')
                .map((item, index) => (
                  <li key={index} className="leading-relaxed">
                    {item.replace(/^[-•*]\s*/, '')}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {quote && (
          <div className="bg-blue-950/40 border border-blue-900/50 rounded-2xl p-4 text-xs text-blue-300 italic">
            "{quote}"
          </div>
        )}
      </div>
    )
  }

  // Kasus 3: Belum check-in sama sekali
  if (!hasCheckedIn) {
    return (
      <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl shadow-xl p-6 sm:p-7 space-y-6 max-w-lg mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Form Check In</h2>
            <p className="text-xs text-slate-400 mt-0.5">Pilih status dan verifikasi lokasi kamu</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
        </div>

        {error && (
          <div className="text-xs text-rose-300 bg-rose-950/50 border border-rose-800/80 rounded-2xl p-3.5 flex items-center gap-2.5">
            <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {geoError && (
          <div className="text-xs text-rose-300 bg-rose-950/50 border border-rose-800/80 rounded-2xl p-3.5 flex items-center gap-2.5">
            <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
            </svg>
            <span>{geoError}</span>
          </div>
        )}

        <div className="space-y-2.5">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Keterangan Kehadiran
          </label>
          <div className="grid grid-cols-3 gap-2.5 p-1.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            {KETERANGAN_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setKeterangan(opt)}
                className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
                  keterangan === opt
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {keterangan !== 'Izin' && (
          <div className="text-xs text-slate-400 bg-slate-950/50 rounded-2xl p-3.5 border border-slate-800 text-center flex items-center justify-center gap-2">
            <span>📍</span>
            <span>Lokasi presensi akan terdeteksi otomatis.</span>
          </div>
        )}

        <button
          onClick={handleCheckIn}
          disabled={submitting || geoLoading}
          className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm bg-blue-600 hover:bg-blue-500 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
        >
          {(submitting || geoLoading) && (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {geoLoading ? 'Mengambil lokasi...' : submitting ? 'Memproses...' : 'Check In Sekarang'}
        </button>
      </div>
    )
  }

  // Kasus 4: Sudah check-in (Hadir/WFA-WFH), belum check-out
  return (
    <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl shadow-xl p-6 sm:p-7 space-y-6 max-w-lg mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Status Bar */}
      <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{attendance?.keterangan}</span>
        </div>
        <span className="text-xs text-emerald-400/90 font-medium">
          Check-in: {new Date(attendance!.check_in_time!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
        </span>
      </div>

      {quote && (
        <div className="bg-blue-950/40 border border-blue-900/50 rounded-2xl p-4 text-xs text-blue-300 italic">
          "{quote}"
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-300 bg-rose-950/50 border border-rose-800/80 rounded-2xl p-3.5 flex items-center gap-2.5">
          <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {geoError && (
        <div className="text-xs text-rose-300 bg-rose-950/50 border border-rose-800/80 rounded-2xl p-3.5 flex items-center gap-2.5">
          <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
          </svg>
          <span>{geoError}</span>
        </div>
      )}

      {/* Upload Bukti */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Foto Bukti Progres Hari Ini <span className="text-rose-400">*</span>
        </label>
        {imagePreview ? (
          <div className="relative border border-slate-800 rounded-2xl overflow-hidden group h-48 bg-slate-950">
            <img src={imagePreview} alt="Preview Progres" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null) }}
              className="absolute top-2.5 right-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl p-2 shadow-lg transition active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-950/50 hover:border-orange-500/50 transition-all group">
            <div className="p-3 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-2xl group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-300 mt-2.5">Ketuk untuk unggah foto</span>
            <span className="text-[11px] text-slate-500 mt-0.5">PNG, JPG (Maks 5MB)</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>

      {/* Textarea Progres */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Keterangan Progres Hari Ini <span className="text-rose-400">*</span>
        </label>
        <textarea
          value={progressNote}
          onChange={(e) => setProgressNote(e.target.value)}
          maxLength={MAX_NOTE_LENGTH}
          rows={3}
          placeholder="Tekan Enter untuk membuat poin baru (contoh: &#10;bikin web upload drive &#10;bikin form)..."
          className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-orange-500 text-slate-200 placeholder:text-slate-600 resize-none transition"
        />
        <p className="text-[11px] text-slate-500 text-right font-medium">{progressNote.length}/{MAX_NOTE_LENGTH}</p>
      </div>

      <button
        type="button"
        onClick={handleCheckOut}
        disabled={submitting || geoLoading}
        className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm bg-orange-600 hover:bg-orange-500 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
      >
        {(submitting || geoLoading) && (
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {geoLoading ? 'Mengambil lokasi...' : submitting ? 'Mengirim...' : 'Check Out Sekarang'}
      </button>
    </div>
  )
}
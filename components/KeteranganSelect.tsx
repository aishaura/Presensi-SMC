'use client'

interface KeteranganSelectProps {
  value: string
  onChange: (value: string) => void
  reasonValue: string
  onReasonChange: (value: string) => void
}

const KETERANGAN_OPTIONS = [
  { id: 'Hadir', label: 'Hadir', desc: 'Presensi fisik di lokasi' },
  { id: 'WFH/WFA', label: 'WFH / WFA', desc: 'Bekerja secara remote' },
  { id: 'Izin', label: 'Izin', desc: 'Tidak dapat mengikuti kegiatan' },
]

export default function KeteranganSelect({
  value,
  onChange,
  reasonValue,
  onReasonChange,
}: KeteranganSelectProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Keterangan Kehadiran <span className="text-rose-500">*</span>
        </label>
        
        {/* Visual Card Selector menggantikan Select HTML standar */}
        <div className="grid grid-cols-3 gap-2">
          {KETERANGAN_OPTIONS.map((opt) => {
            const isSelected = value === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={`py-3 px-2 rounded-xl text-center border transition-all duration-150 flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                  isSelected
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm font-semibold'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className="text-xs sm:text-sm">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Input Alasan Izin (Tampil kondisional) */}
      {value === 'Izin' && (
        <div className="space-y-1.5 animate-in fade-in duration-200">
          <label htmlFor="alasan" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Alasan Izin <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="alasan"
            required
            rows={3}
            value={reasonValue}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Tulis alasan izin secara singkat (contoh: Sakit demam, Keperluan keluarga)..."
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 placeholder:text-gray-400 resize-none transition"
          />
        </div>
      )}
    </div>
  )
}
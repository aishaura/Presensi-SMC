'use client'

interface KeteranganSelectProps {
  value: string
  onChange: (value: string) => void
  reasonValue: string
  onReasonChange: (value: string) => void
}

export default function KeteranganSelect({
  value,
  onChange,
  reasonValue,
  onReasonChange,
}: KeteranganSelectProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700 mb-1">
          Keterangan Kehadiran
        </label>
        <select
          id="keterangan"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="Hadir">Hadir</option>
          <option value="WFH/WFA">WFH/WFA</option>
          <option value="Izin">Izin</option>
        </select>
      </div>

      {value === 'Izin' && (
        <div>
          <label htmlFor="alasan" className="block text-sm font-medium text-gray-700 mb-1">
            Alasan Izin
          </label>
          <textarea
            id="alasan"
            required
            rows={3}
            value={reasonValue}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Tulis alasan izin secara singkat dan jelas (misal: Sakit demam, Keperluan keluarga)..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  )
}

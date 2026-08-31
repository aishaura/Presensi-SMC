'use client'

import { useState } from 'react'

interface AttendanceRecord {
  id: string
  date: string
  keterangan: string
  check_in_time: string
  check_in_lat: number
  check_in_lng: number
  check_in_address: string | null
  check_in_image_url: string
  check_out_time: string | null
  check_out_lat: number | null
  check_out_lng: number | null
  check_out_address: string | null
  check_out_image_url: string | null
  profiles: {
    name: string
    phone: string | null
  }
}

interface AttendanceTableProps {
  initialRecords: AttendanceRecord[]
}

export default function AttendanceTable({ initialRecords }: AttendanceTableProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterKeterangan, setFilterKeterangan] = useState('Semua')
  const [filterDate, setFilterDate] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)

  // Filter logika di frontend
  const filteredRecords = records.filter((rec) => {
    const matchName = rec.profiles.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Klasifikasi keterangan (Hadir, WFH/WFA, Izin)
    let type = 'Hadir'
    if (rec.keterangan.startsWith('Izin')) {
      type = 'Izin'
    } else if (rec.keterangan === 'WFH/WFA') {
      type = 'WFH/WFA'
    }
    
    const matchKeterangan = filterKeterangan === 'Semua' || type === filterKeterangan
    const matchDate = !filterDate || rec.date === filterDate

    return matchName && matchKeterangan && matchDate
  })

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
      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border p-4 rounded-xl shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Cari Nama
          </label>
          <input
            type="text"
            placeholder="Cari nama karyawan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            suppressHydrationWarning
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Status Kehadiran
          </label>
          <select
            value={filterKeterangan}
            onChange={(e) => setFilterKeterangan(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            suppressHydrationWarning
          >
            <option value="Semua">Semua Keterangan</option>
            <option value="Hadir">Hadir</option>
            <option value="WFH/WFA">WFH/WFA</option>
            <option value="Izin">Izin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Tanggal
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* Tabel Rekap */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y text-gray-600">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Tidak ada data presensi yang cocok
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {new Date(rec.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{rec.profiles.name}</div>
                      {rec.profiles.phone && <div className="text-xs text-gray-400">{rec.profiles.phone}</div>}
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
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{formatTime(rec.check_in_time)}</div>
                      <div className="text-xs text-gray-400 truncate max-w-45" title={rec.check_in_address || ''}>
                        {rec.check_in_address || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{formatTime(rec.check_out_time)}</div>
                      <div className="text-xs text-gray-400 truncate max-w-45" title={rec.check_out_address || ''}>
                        {rec.check_out_address || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Presensi */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Detail Presensi</h3>
                <p className="text-xs text-gray-500">{formatDate(selectedRecord.date)}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Info Kiri */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Karyawan</label>
                  <p className="font-bold text-gray-900">{selectedRecord.profiles.name}</p>
                  {selectedRecord.profiles.phone && <p className="text-sm text-gray-500">{selectedRecord.profiles.phone}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Keterangan</label>
                  <p className="font-semibold text-gray-800">{selectedRecord.keterangan}</p>
                </div>

                {/* Check In Detail */}
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-bold text-sm text-blue-600">CHECK IN DETAILS</h4>
                  <div>
                    <label className="text-xs text-gray-400">Jam Check In</label>
                    <p className="text-sm font-semibold">{formatTime(selectedRecord.check_in_time)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Alamat</label>
                    <p className="text-sm leading-relaxed">{selectedRecord.check_in_address || '-'}</p>
                  </div>
                  <div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedRecord.check_in_lat},${selectedRecord.check_in_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold mt-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Lihat di Google Maps
                    </a>
                  </div>
                </div>

                {/* Check Out Detail */}
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-bold text-sm text-orange-600">CHECK OUT DETAILS</h4>
                  {selectedRecord.check_out_time ? (
                    <>
                      <div>
                        <label className="text-xs text-gray-400">Jam Check Out</label>
                        <p className="text-sm font-semibold">{formatTime(selectedRecord.check_out_time)}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Alamat</label>
                        <p className="text-sm leading-relaxed">{selectedRecord.check_out_address || '-'}</p>
                      </div>
                      {selectedRecord.check_out_lat && selectedRecord.check_out_lng && (
                        <div>
                          <a
                            href={`https://www.google.com/maps?q=${selectedRecord.check_out_lat},${selectedRecord.check_out_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:underline font-semibold mt-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Lihat di Google Maps
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Belum melakukan check-out</p>
                  )}
                </div>
              </div>

              {/* Info Kanan (Foto) */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Foto Check In</label>
                  <div className="border rounded-xl overflow-hidden bg-gray-50 h-44 flex items-center justify-center">
                    {selectedRecord.check_in_image_url ? (
                      <img
                        src={selectedRecord.check_in_image_url}
                        alt="Foto Check In"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">Foto tidak tersedia</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Foto Progres Check Out</label>
                  <div className="border rounded-xl overflow-hidden bg-gray-50 h-44 flex items-center justify-center">
                    {selectedRecord.check_out_image_url ? (
                      <img
                        src={selectedRecord.check_out_image_url}
                        alt="Foto Progres"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs italic">Tidak ada foto progres</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useRef, useState, useEffect } from 'react'

interface ImageUploaderProps {
  label: string
  onChange: (file: File | null) => void
  required?: boolean
}

export default function ImageUploader({
  label,
  onChange,
  required = false,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      onChange(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      onChange(null)
      setPreview(null)
    }
  }

  const handleRemove = () => {
    onChange(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {preview ? (
        <div className="relative border rounded-lg overflow-hidden bg-gray-50 h-48 flex items-center justify-center">
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1.5 rounded-md shadow-sm transition"
          >
            Hapus Foto
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition hover:bg-blue-50/20"
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div className="text-sm font-medium text-gray-600">Ambil Foto atau Pilih Berkas</div>
            <div className="text-xs text-gray-400">Dukung file gambar PNG, JPG, JPEG (Max. 5MB)</div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment" // Buka kamera langsung di HP jika didukung
            required={required}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}

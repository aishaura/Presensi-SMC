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
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup Object URL untuk mencegah memory leak
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  const processFile = (file: File | null) => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }

    if (file && file.type.startsWith('image/')) {
      onChange(file)
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
    } else {
      onChange(null)
      setPreview(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    processFile(file)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    processFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0] || null
    processFile(file)
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {preview ? (
        <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-slate-900/5 h-52 flex items-center justify-center group shadow-inner">
          <img src={preview} alt="Preview Bukti" className="h-full w-full object-cover" />
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={handleRemove}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Ganti Foto
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
              : 'border-gray-200 hover:border-blue-400 hover:bg-slate-50/60'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Ambil Foto <span className="text-gray-400 font-normal">atau</span> Pilih Berkas
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Format PNG, JPG, JPEG (Maks. 5MB)</p>
            </div>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
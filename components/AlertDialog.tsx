'use client'

interface AlertDialogProps {
  open: boolean
  type: 'success' | 'error' | 'confirm'
  title: string
  message: string
  onConfirm?: () => void
  onClose: () => void
  confirmLabel?: string
  cancelLabel?: string
}

export default function AlertDialog({
  open,
  type,
  title,
  message,
  onConfirm,
  onClose,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
}: AlertDialogProps) {
  if (!open) return null

  const iconByType = {
    success: (
      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    error: (
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    confirm: (
      <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-6 flex flex-col items-center text-center gap-3">
          {iconByType[type]}
          <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>

        <div className="px-6 pb-6 flex items-center gap-3">
          {type === 'confirm' ? (
            <>
              {/* Tombol Batal yang dipertegas */}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 transition active:scale-[0.98]"
              >
                {cancelLabel}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onConfirm?.()
                  onClose()
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-[0.98]"
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition text-white active:scale-[0.98] ${
                type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
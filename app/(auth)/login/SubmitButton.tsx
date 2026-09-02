'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-blue-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {pending && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {pending ? 'Memproses...' : 'Masuk Ke Akun'}
    </button>
  )
}
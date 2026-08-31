'use client'

import { useState, useEffect } from 'react'

export default function DigitalClock() {
  const [time, setTime] = useState<string>('')
  const [dateStr, setDateStr] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      )
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      )
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Hydration skeleton loader
  if (!time) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm max-w-sm mx-auto animate-pulse flex flex-col items-center justify-center space-y-2">
        <div className="h-9 w-40 bg-gray-200 rounded-lg"></div>
        <div className="h-4 w-48 bg-gray-100 rounded-md"></div>
      </div>
    )
  }

  return (
    <div className="bg-linear-to-br from-white via-slate-50/50 to-blue-50/30 border border-gray-100/80 rounded-2xl p-5 shadow-sm hover:shadow transition-all max-w-sm mx-auto text-center space-y-1.5 backdrop-blur-sm relative overflow-hidden">
      {/* Decorative Blur Accent */}
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

      {/* Jam Digital */}
      <div className="text-3xl sm:text-4xl font-black tracking-wider text-slate-800 font-mono drop-shadow-xs">
        {time} <span className="text-xs font-semibold text-blue-600 tracking-normal uppercase ml-0.5">WIB</span>
      </div>

      {/* Tanggal */}
      <div className="text-xs sm:text-sm font-medium text-slate-500 tracking-wide flex items-center justify-center gap-1.5">
        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{dateStr}</span>
      </div>
    </div>
  )
}
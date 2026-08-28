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

  // Mencegah mismatch hydration dengan state awal kosong
  if (!time) {
    return <div className="animate-pulse h-16 bg-gray-100 rounded-lg"></div>
  }

  return (
    <div className="text-center space-y-1">
      <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 font-mono">
        {time}
      </div>
      <div className="text-sm font-medium text-gray-500">
        {dateStr}
      </div>
    </div>
  )
}

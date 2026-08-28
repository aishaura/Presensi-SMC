'use client'

import { useState, useCallback } from 'react'

interface GeoState {
  lat: number | null
  lng: number | null
  loading: boolean
  error: string | null
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    lat: null,
    lng: null,
    loading: false,
    error: null,
  })

  const getLocation = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Browser tidak mendukung geolokasi'
        setState((s) => ({ ...s, error, loading: false }))
        reject(new Error(error))
        return
      }

      setState((s) => ({ ...s, loading: true, error: null }))

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setState({ lat, lng, loading: false, error: null })
          resolve({ lat, lng })
        },
        (err) => {
          let message = 'Gagal mengambil lokasi'
          if (err.code === err.PERMISSION_DENIED) {
            message = 'Izin lokasi ditolak. Aktifkan akses lokasi di browser.'
          } else if (err.code === err.TIMEOUT) {
            message = 'Waktu pengambilan lokasi habis, coba lagi.'
          }
          setState((s) => ({ ...s, loading: false, error: message }))
          reject(new Error(message))
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    })
  }, [])

  return { ...state, getLocation }
}
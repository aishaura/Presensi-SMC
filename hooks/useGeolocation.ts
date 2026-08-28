'use client'

import { useState } from 'react'

interface Coords {
  latitude: number
  longitude: number
}

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getLocation = (): Promise<Coords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation tidak didukung oleh browser Anda'
        setError(errorMsg)
        reject(errorMsg)
        return
      }

      setLoading(true)
      setError(null)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          setCoords(newCoords)
          setLoading(false)
          resolve(newCoords)
        },
        (err) => {
          let errorMsg = 'Gagal mengambil lokasi'
          if (err.code === err.PERMISSION_DENIED) {
            errorMsg = 'Izin akses lokasi ditolak oleh pengguna'
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorMsg = 'Informasi lokasi tidak tersedia'
          } else if (err.code === err.TIMEOUT) {
            errorMsg = 'Waktu permintaan lokasi habis'
          }
          setError(errorMsg)
          setLoading(false)
          reject(errorMsg)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }

  return { coords, loading, error, getLocation }
}

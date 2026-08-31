'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface GeoLocationResult {
  lat: number
  lng: number
  latitude: number
  longitude: number
  accuracy?: number
}

interface GeoState {
  lat: number | null
  lng: number | null
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  loading: boolean
  error: string | null
}

export function useGeolocation(options: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) {
  const [state, setState] = useState<GeoState>({
    lat: null,
    lng: null,
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
  })

  // Ref untuk mengawasi status unmount komponen
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const getLocation = useCallback((): Promise<GeoLocationResult> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        const errorMsg = 'Browser tidak mendukung geolokasi'
        if (isMounted.current) {
          setState((s) => ({ ...s, error: errorMsg, loading: false }))
        }
        reject(new Error(errorMsg))
        return
      }

      if (isMounted.current) {
        setState((s) => ({ ...s, loading: true, error: null }))
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude
          const longitude = position.coords.longitude
          const accuracy = position.coords.accuracy

          const result: GeoLocationResult = {
            lat: latitude,
            lng: longitude,
            latitude,
            longitude,
            accuracy,
          }

          if (isMounted.current) {
            setState({
              lat: latitude,
              lng: longitude,
              latitude,
              longitude,
              accuracy,
              loading: false,
              error: null,
            })
          }
          resolve(result)
        },
        (err) => {
          let message = 'Gagal mengambil lokasi'
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = 'Izin lokasi ditolak. Aktifkan akses lokasi di browser.'
              break
            case err.POSITION_UNAVAILABLE:
              message = 'Informasi lokasi tidak tersedia. Coba aktifkan GPS.'
              break
            case err.TIMEOUT:
              message = 'Waktu pengambilan lokasi habis, silakan coba lagi.'
              break
          }

          if (isMounted.current) {
            setState((s) => ({ ...s, loading: false, error: message }))
          }
          reject(new Error(message))
        },
        options
      )
    })
  }, [options])

  return { ...state, getLocation }
}
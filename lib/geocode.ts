export async function reverseGeocode(lat: number, lng: number): Promise<string> {

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'Presensi-SMC-App/1.0 (contact: support@saungmirzacomunity.org)'
        },
        next: { revalidate: 3600 }
      }
    )

    if (!response.ok) {
      throw new Error('Gagal memanggil reverse geocoding API')
    }

    const data = await response.json()
    
    // Ambil alamat yang lebih ringkas/readable
    const address = data.address
    if (address) {
      const village = address.village || address.suburb || address.neighbourhood || ''
      const city = address.city || address.city_district || address.regency || ''
      const state = address.state || ''
      
      const parts = [village, city, state].filter(Boolean)
      if (parts.length > 0) {
        return parts.join(', ')
      }
    }
    
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  } catch (error) {
    console.error('Error in reverseGeocode:', error)
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
}

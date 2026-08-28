export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'User-Agent': 'presensi-smc-app' } }
  )
  const data = await res.json()
  return data.display_name ?? 'Lokasi tidak diketahui'
}
export type Role = 'employee' | 'admin'
export type Keterangan = 'Hadir' | 'Izin' | 'WFA/WFH'

export interface Profile {
  id: string
  name: string
  phone: string | null
  role: Role
  created_at: string
}

export interface Attendance {
  id: string
  user_id: string
  date: string
  keterangan: Keterangan | null // null selama belum check-out
  check_in_time: string | null
  check_in_lat: number | null
  check_in_lng: number | null
  check_in_address: string | null
  check_out_time: string | null
  check_out_lat: number | null
  check_out_lng: number | null
  check_out_address: string | null
  check_out_image_url: string | null // foto sekarang cuma di check-out
  created_at: string
  progress_note: string | null
}

// Attendance yang di-join dengan nama user, dipakai di tabel admin
export interface AttendanceWithProfile extends Attendance {
  profile: Pick<Profile, 'name' | 'phone'>
}

// ---- Request/Response API ----

export interface CheckInRequest {
  lat: number
  lng: number
  keterangan: Keterangan
  image: File // dikirim via FormData, bukan JSON biasa
}

export interface CheckInResponse {
  success: boolean
  data?: {
    checkInTime: string
    address: string
    imageUrl: string
  }
  error?: string
}

export interface CheckOutRequest {
  lat: number
  lng: number
  image?: File
}

export interface CheckOutResponse {
  success: boolean
  data?: {
    checkOutTime: string
    address: string
    imageUrl?: string
  }
  error?: string
}
const quotes = [
  "Semangat magang hari ini! Setiap kontribusi kecilmu sangat berharga bagi Saung Mirza Community.",
  "Fokus pada proses belajar, bukan hanya hasil akhir. Kamu sedang berproses menjadi lebih baik!",
  "Kerja keras tidak pernah mengkhianati hasil. Tetap konsisten dan berikan yang terbaik!",
  "Kesuksesan dimulai dari langkah kecil hari ini. Semangat melakukan presensi dan berkarya!",
  "Setiap hari adalah kesempatan baru untuk tumbuh dan belajar hal baru. Manfaatkan hari ini dengan baik!",
  "Disiplin adalah jembatan antara cita-cita dan pencapaian. Terima kasih sudah presensi tepat waktu!",
  "Jadikan hari ini lebih baik dari kemarin. Tetap semangat, kreatif, dan jaga kesehatan!",
  "Kerja sama tim membuat impian menjadi nyata. Selamat beraktivitas bersama rekan-rekan magang!",
  "Kesalahan adalah bukti bahwa kamu sedang mencoba. Jangan takut salah, teruslah belajar!",
  "Semangat! Kehadiranmu hari ini membawa energi positif bagi kita semua."
]

export function getRandomQuote(): string {
  const index = Math.floor(Math.random() * quotes.length)
  return quotes[index]
}

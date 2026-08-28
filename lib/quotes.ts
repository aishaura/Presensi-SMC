const quotes = [
  "Semangat! Hari ini adalah kesempatan baru untuk berkarya.",
  "Kerja keras hari ini, hasil manis nanti.",
  "Setiap langkah kecil membawamu lebih dekat ke tujuan.",
  "Jangan lupa istirahat, tubuh yang sehat kerja makin semangat.",
  "Kamu hebat! Teruslah memberikan yang terbaik.",
]

export function getRandomQuote(): string {
  return quotes[Math.floor(Math.random() * quotes.length)]
}
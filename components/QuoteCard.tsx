'use client'

interface QuoteCardProps {
  quote: string
}

export default function QuoteCard({ quote }: QuoteCardProps) {
  if (!quote) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-4xl text-blue-400 font-serif leading-none select-none">“</span>
        <div className="space-y-1.5">
          <p className="text-blue-900 font-medium text-sm leading-relaxed italic">
            {quote}
          </p>
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
            Saung Mirza Community
          </p>
        </div>
      </div>
    </div>
  )
}

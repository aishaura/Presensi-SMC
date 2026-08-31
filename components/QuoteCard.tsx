'use client'

interface QuoteCardProps {
  quote: string
  author?: string
}

export default function QuoteCard({ quote, author = 'Saung Mirza Community' }: QuoteCardProps) {
  if (!quote) return null

  return (
    <div className="bg-linear-to-br from-blue-50/90 via-indigo-50/70 to-slate-50/80 border border-blue-100/80 rounded-2xl p-5 shadow-sm hover:shadow transition-all backdrop-blur-sm relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-start gap-3.5 relative z-10">
        <span className="text-4xl text-blue-400/80 font-serif leading-none select-none shrink-0 -mt-1">
          “
        </span>
        <div className="space-y-2 flex-1">
          <p className="text-blue-950 font-medium text-sm leading-relaxed italic">
            {quote}
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="w-4 h-0.5 bg-blue-400/60 rounded-full" />
            <p className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider">
              {author}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
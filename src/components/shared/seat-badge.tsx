interface SeatBadgeProps {
  available: number
  total: number
}

export function SeatBadge({ available, total: _total }: SeatBadgeProps) {
  if (available === 0) {
    return (
      <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
        Sold Out
      </span>
    )
  }

  if (available < 5) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        {available} {available === 1 ? "seat" : "seats"} left
      </span>
    )
  }

  if (available < 10) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
        <span className="inline-flex rounded-full h-2 w-2 bg-amber-400" />
        {available} seats left
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
      <span className="inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      {available} seats left
    </span>
  )
}

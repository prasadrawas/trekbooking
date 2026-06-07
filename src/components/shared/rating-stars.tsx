import { Star } from "lucide-react"

interface RatingStarsProps {
  rating: number
  count?: number
  size?: "sm" | "md" | "lg"
}

const SIZE_MAP = {
  sm: { star: "w-3.5 h-3.5", text: "text-xs", gap: "gap-0.5" },
  md: { star: "w-4 h-4", text: "text-sm", gap: "gap-1" },
  lg: { star: "w-5 h-5", text: "text-base", gap: "gap-1" },
}

export function RatingStars({ rating, count, size = "md" }: RatingStarsProps) {
  const { star, text, gap } = SIZE_MAP[size]
  const clamped = Math.min(5, Math.max(0, rating))

  return (
    <div className={`flex items-center ${gap}`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = clamped >= i + 1
        const half = !filled && clamped >= i + 0.5

        return (
          <span key={i} className="relative inline-flex shrink-0">
            {/* Empty star base */}
            <Star className={`${star} text-gray-200`} fill="currentColor" />

            {/* Filled or half overlay */}
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: half ? "50%" : "100%" }}
              >
                <Star className={`${star} text-amber-400`} fill="currentColor" />
              </span>
            )}
          </span>
        )
      })}

      {typeof count === "number" && (
        <span className={`ml-1 text-gray-500 ${text}`}>
          ({count.toLocaleString("en-IN")} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  )
}

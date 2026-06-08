import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Clock, RouteIcon, Baby, MapPin, Mountain } from "lucide-react"
import { RatingStars } from "@/components/shared/rating-stars"
import { SeatBadge } from "@/components/shared/seat-badge"
import { DIFFICULTY_LEVELS } from "@/lib/constants"

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

export interface TrekCardProps {
  trek: {
    title: string
    slug: string
    cover_image?: string | null
    difficulty: "easy" | "moderate" | "difficult" | "very_difficult"
    duration: number
    distance: number
    price: number
    rating: number
    total_reviews: number
    available_seats: number
    total_seats?: number
    next_date?: string | null
    is_child_friendly: boolean
    organizer_name: string
    region: string
  }
}

export const TrekCard = React.memo(function TrekCard({ trek }: TrekCardProps) {
  const difficultyMeta =
    DIFFICULTY_LEVELS.find((d) => d.value === trek.difficulty) ?? DIFFICULTY_LEVELS[0]

  const formattedPrice = priceFormatter.format(trek.price)

  const formattedDate = trek.next_date
    ? dateFormatter.format(new Date(trek.next_date))
    : null

  return (
    <Link href={`/treks/${trek.slug}`} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl">
      <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-full flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
        {/* Image section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100">
          {trek.cover_image ? (
            <Image
              src={trek.cover_image}
              alt={trek.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-300">
              <Mountain className="w-12 h-12 mb-1" />
              <span className="text-xs font-medium text-emerald-400">No image</span>
            </div>
          )}

          {/* Difficulty badge — top left */}
          <span
            className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${difficultyMeta.color}`}
          >
            {difficultyMeta.label}
          </span>

          {/* Child friendly badge — top right */}
          {trek.is_child_friendly && (
            <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold bg-emerald-500 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
              <Baby className="w-3.5 h-3.5" />
              Child Friendly
            </span>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Title + organizer */}
          <div>
            <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {trek.title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">by {trek.organizer_name}</p>
          </div>

          {/* Region */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{trek.region}</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {trek.duration === 1 ? "1 Day" : `${trek.duration} Days`}
            </span>
            <span className="flex items-center gap-1">
              <RouteIcon className="w-3.5 h-3.5 text-gray-400" />
              {trek.distance} km
            </span>
          </div>

          {/* Rating */}
          <RatingStars rating={trek.rating} count={trek.total_reviews} size="sm" />

          {/* Spacer to push price/seat info to bottom */}
          <div className="flex-1" />

          {/* Price + seats */}
          <div className="flex items-end justify-between border-t border-gray-100 pt-3">
            <div>
              <p className="text-lg font-bold text-gray-900">{formattedPrice}</p>
              <p className="text-xs text-gray-400">per person</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <SeatBadge
                available={trek.available_seats}
                total={trek.total_seats ?? trek.available_seats + 5}
              />
              {formattedDate && (
                <p className="text-xs text-gray-400">Next: {formattedDate}</p>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
})

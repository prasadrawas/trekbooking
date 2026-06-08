export interface MappedTrek {
  title: string;
  slug: string;
  cover_image: string | null;
  difficulty: "easy" | "moderate" | "difficult" | "very_difficult";
  duration: number;
  distance: number;
  price: number;
  rating: number;
  total_reviews: number;
  available_seats: number;
  total_seats: number;
  next_date: string | null;
  is_child_friendly: boolean;
  organizer_name: string;
  region: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiTrek(t: any): MappedTrek {
  let org = t.organizer ?? t.organizers ?? null;
  if (Array.isArray(org)) org = org[0];
  let coverImg = null;
  if (t.cover_image) {
    coverImg = typeof t.cover_image === "string" ? t.cover_image : t.cover_image.image_url ?? null;
  }
  return {
    title: String(t.title ?? ""),
    slug: String(t.slug ?? ""),
    cover_image: coverImg,
    difficulty: (t.difficulty ?? "moderate") as MappedTrek["difficulty"],
    duration: Number(t.duration_days ?? 1),
    distance: Number(t.distance_km ?? 0),
    price: Number(t.next_event?.price ?? t.default_adult_price ?? 0),
    rating: Number(org?.avg_rating ?? 0),
    total_reviews: Number(t.total_reviews ?? 0),
    available_seats: t.next_event ? Number(t.next_event.seats_available ?? 0) : 99,
    total_seats: t.next_event ? Number(t.next_event.seats_available ?? 0) : 99,
    next_date: t.next_event?.event_date ?? null,
    is_child_friendly: Boolean(t.is_child_friendly),
    organizer_name: String(org?.org_name ?? ""),
    region: String(t.region ?? ""),
  };
}

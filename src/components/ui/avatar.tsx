import * as React from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Avatar root
// ---------------------------------------------------------------------------
const Avatar = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = "Avatar"

// ---------------------------------------------------------------------------
// AvatarImage
// ---------------------------------------------------------------------------
export interface AvatarImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: "loading" | "loaded" | "error") => void
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, onLoadingStatusChange, onLoad, onError, ...props }, ref) => {
    const handleLoad = React.useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        onLoadingStatusChange?.("loaded")
        onLoad?.(e)
      },
      [onLoad, onLoadingStatusChange]
    )

    const handleError = React.useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        onLoadingStatusChange?.("error")
        onError?.(e)
      },
      [onError, onLoadingStatusChange]
    )

    return (
      <img
        ref={ref}
        className={cn(
          "aspect-square h-full w-full rounded-full object-cover",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

// ---------------------------------------------------------------------------
// AvatarFallback  – shown when no image is provided or image fails to load
// ---------------------------------------------------------------------------
const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium select-none",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }

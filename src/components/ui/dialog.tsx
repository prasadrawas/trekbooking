"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) {
    throw new Error("Dialog sub-components must be used inside <Dialog>")
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Dialog root
// ---------------------------------------------------------------------------
export interface DialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleOpenChange(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, handleOpenChange])

  // Prevent body scroll while open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// DialogTrigger
// ---------------------------------------------------------------------------
export interface DialogTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ onClick, ...props }, ref) => {
    const { onOpenChange } = useDialogContext()
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          onOpenChange(true)
          onClick?.(e)
        }}
        {...props}
      />
    )
  }
)
DialogTrigger.displayName = "DialogTrigger"

// ---------------------------------------------------------------------------
// DialogPortal — renders children into document.body via portal
// ---------------------------------------------------------------------------
function DialogPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null
  return createPortal(children, document.body)
}

// ---------------------------------------------------------------------------
// DialogOverlay (backdrop)
// ---------------------------------------------------------------------------
const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, onClick, ...props }, ref) => {
  const { onOpenChange } = useDialogContext()
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "animate-in fade-in-0 duration-200",
        className
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false)
        onClick?.(e)
      }}
      {...props}
    />
  )
})
DialogOverlay.displayName = "DialogOverlay"

// ---------------------------------------------------------------------------
// DialogContent
// ---------------------------------------------------------------------------
export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Hide the default close button */
  hideCloseButton?: boolean
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, hideCloseButton = false, ...props }, ref) => {
    const { open, onOpenChange } = useDialogContext()

    if (!open) return null

    return (
      <DialogPortal>
        <DialogOverlay>
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
              "rounded-xl border bg-background p-6 shadow-lg",
              "animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] duration-200",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {children}
            {!hideCloseButton && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={cn(
                  "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity",
                  "hover:opacity-100",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:pointer-events-none"
                )}
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </DialogOverlay>
      </DialogPortal>
    )
  }
)
DialogContent.displayName = "DialogContent"

// ---------------------------------------------------------------------------
// DialogHeader
// ---------------------------------------------------------------------------
function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}
DialogHeader.displayName = "DialogHeader"

// ---------------------------------------------------------------------------
// DialogFooter
// ---------------------------------------------------------------------------
function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
        className
      )}
      {...props}
    />
  )
}
DialogFooter.displayName = "DialogFooter"

// ---------------------------------------------------------------------------
// DialogTitle
// ---------------------------------------------------------------------------
const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

// ---------------------------------------------------------------------------
// DialogDescription
// ---------------------------------------------------------------------------
const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground mt-1.5", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

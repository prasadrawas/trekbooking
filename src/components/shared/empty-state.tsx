import type { LucideIcon } from "lucide-react"

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: "primary" | "secondary"
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: EmptyStateAction
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 animate-fadeUp">
      {/* Icon container */}
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-50 mb-5 animate-fadeUp stagger-1">
        <Icon className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-gray-800 mb-2 animate-fadeIn stagger-2">
        {title}
      </h3>

      <p className="text-sm text-gray-500 max-w-sm leading-relaxed animate-fadeIn stagger-3">
        {description}
      </p>

      {/* Action button */}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={`mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 animate-fadeUp stagger-4 ${
            action.variant === "secondary"
              ? "border border-gray-200 text-gray-700 hover:border-emerald-400 hover:text-emerald-700"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

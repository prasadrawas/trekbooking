import { motion } from "framer-motion"
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.58, 1] as [number, number, number, number] }}
      className="flex flex-col items-center justify-center text-center px-6 py-16"
    >
      {/* Icon container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.35, ease: [0, 0, 0.58, 1] as [number, number, number, number] }}
        className="flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-50 mb-5"
      >
        <Icon className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
      </motion.div>

      {/* Text */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-gray-800 mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-sm text-gray-500 max-w-sm leading-relaxed"
      >
        {description}
      </motion.p>

      {/* Action button */}
      {action && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          type="button"
          onClick={action.onClick}
          className={`mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
            action.variant === "secondary"
              ? "border border-gray-200 text-gray-700 hover:border-emerald-400 hover:text-emerald-700"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          }`}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

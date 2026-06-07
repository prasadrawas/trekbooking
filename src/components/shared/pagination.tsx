"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "ellipsis")[] = []

  // Always show first page
  pages.push(1)

  if (current <= 4) {
    // Near the start: 1 2 3 4 5 ... last
    for (let i = 2; i <= Math.min(5, total - 1); i++) pages.push(i)
    pages.push("ellipsis")
  } else if (current >= total - 3) {
    // Near the end: 1 ... n-4 n-3 n-2 n-1 last
    pages.push("ellipsis")
    for (let i = Math.max(total - 4, 2); i <= total - 1; i++) pages.push(i)
  } else {
    // Middle: 1 ... prev current next ... last
    pages.push("ellipsis")
    pages.push(current - 1)
    pages.push(current)
    pages.push(current + 1)
    pages.push("ellipsis")
  }

  // Always show last page
  pages.push(total)

  return pages
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = buildPageNumbers(currentPage, totalPages)
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  const baseBtn =
    "flex items-center justify-center h-9 min-w-9 rounded-lg text-sm font-medium transition-all border"
  const activeBtn = `${baseBtn} bg-emerald-600 border-emerald-600 text-white shadow-sm`
  const inactiveBtn = `${baseBtn} border-gray-200 text-gray-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50`
  const disabledBtn = `${baseBtn} border-gray-100 text-gray-300 cursor-not-allowed`

  let ellipsisKey = 0

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 flex-wrap">
      {/* Previous */}
      <button
        type="button"
        onClick={() => hasPrev && onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        aria-label="Previous page"
        className={hasPrev ? `${inactiveBtn} px-3 gap-1` : `${disabledBtn} px-3 gap-1`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Page numbers */}
      {pages.map((page) => {
        if (page === "ellipsis") {
          ellipsisKey++
          return (
            <span
              key={`ellipsis-${ellipsisKey}`}
              className="flex items-center justify-center h-9 w-9 text-gray-400"
            >
              <MoreHorizontal className="w-4 h-4" />
            </span>
          )
        }

        const isActive = page === currentPage
        return (
          <button
            key={page}
            type="button"
            onClick={() => !isActive && onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={isActive ? "page" : undefined}
            className={isActive ? `${activeBtn} px-3` : `${inactiveBtn} px-3`}
          >
            {page}
          </button>
        )
      })}

      {/* Next */}
      <button
        type="button"
        onClick={() => hasNext && onPageChange(currentPage + 1)}
        disabled={!hasNext}
        aria-label="Next page"
        className={hasNext ? `${inactiveBtn} px-3 gap-1` : `${disabledBtn} px-3 gap-1`}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}

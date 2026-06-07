import { Mountain } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-center gap-5">
      {/* Mountain icon with pulse ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring */}
        <span className="absolute inline-flex h-20 w-20 rounded-full bg-emerald-400 opacity-20 animate-ping" />
        {/* Inner ring */}
        <span className="absolute inline-flex h-14 w-14 rounded-full bg-emerald-300 opacity-30 animate-ping [animation-delay:150ms]" />
        {/* Icon container */}
        <div className="relative z-10 w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
          <Mountain className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Loading text */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-gray-700 font-semibold text-base tracking-wide">
          Loading...
        </p>
        <p className="text-gray-400 text-sm">Preparing your trails</p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

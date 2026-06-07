import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Form area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        {children}
      </div>

      {/* Decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col items-center justify-center relative overflow-hidden">
        {/* Mountain gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #1a3a2a 0%, #2d5a3d 30%, #4a7c59 55%, #6b9e78 75%, #8fb89a 90%, #b5d4c0 100%)",
          }}
        />

        {/* Layered mountain silhouettes */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full"
          viewBox="0 0 560 320"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Far mountains */}
          <path
            d="M0 200 L80 100 L160 150 L240 60 L320 120 L400 80 L480 130 L560 90 L560 320 L0 320 Z"
            fill="rgba(255,255,255,0.07)"
          />
          {/* Mid mountains */}
          <path
            d="M0 240 L100 160 L180 200 L260 130 L340 170 L420 120 L500 165 L560 140 L560 320 L0 320 Z"
            fill="rgba(255,255,255,0.1)"
          />
          {/* Near mountains */}
          <path
            d="M0 280 L120 200 L200 240 L280 180 L360 220 L440 175 L520 210 L560 195 L560 320 L0 320 Z"
            fill="rgba(255,255,255,0.13)"
          />
          {/* Foreground */}
          <path
            d="M0 310 L140 260 L220 285 L300 255 L380 275 L460 250 L560 268 L560 320 L0 320 Z"
            fill="rgba(255,255,255,0.18)"
          />
        </svg>

        {/* Branding content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 gap-8">
          {/* Logo mark */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/25">
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              SahyadriBook
            </span>
          </div>

          {/* Tagline */}
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
              Every trail tells
              <br />a story.
            </h2>
            <p className="text-base text-white/75 leading-relaxed max-w-xs">
              Discover, book, and conquer the majestic Sahyadri ranges with
              trusted trek organizers.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {[
              "200+ verified trek routes",
              "Certified local guides",
              "Secure instant booking",
            ].map((feat) => (
              <div
                key={feat}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15"
              >
                <div className="w-2 h-2 rounded-full bg-green-300 shrink-0" />
                <span className="text-sm text-white/90 font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>
    </div>
  );
}

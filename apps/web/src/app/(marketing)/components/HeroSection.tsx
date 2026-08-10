import React from 'react';

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  badgeText?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title = "Streamline Your Business Operations with Wrenchly",
  subtitle = "The all-in-one management platform designed for modern service teams and repair shops.",
  primaryCtaText = "Get Started Free",
  primaryCtaHref = "/register",
  secondaryCtaText = "Book a Demo",
  secondaryCtaHref = "/demo",
  badgeText = "New: AI-Powered Scheduling v2.0",
}) => {
  return (
    <section 
      data-testid="hero-section"
      className="relative overflow-hidden bg-slate-950 text-slate-100 py-20 px-4 sm:px-6 lg:px-8"
    >
      {/* Background radial gradient glow */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950/80 to-slate-950 pointer-events-none" 
      />

      <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Column: Content & Typography */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          {badgeText && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>{badgeText}</span>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            {title.includes("Wrenchly") ? (
              <>
                {title.split("Wrenchly")[0]}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Wrenchly
                </span>
                {title.split("Wrenchly")[1]}
              </>
            ) : (
              title
            )}
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
            {subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <a
              href={primaryCtaHref}
              data-testid="hero-primary-cta"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all duration-200 shadow-lg shadow-blue-600/30 text-center"
            >
              {primaryCtaText}
            </a>
            <a
              href={secondaryCtaHref}
              data-testid="hero-secondary-cta"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 hover:text-white border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all duration-200 backdrop-blur-sm text-center"
            >
              {secondaryCtaText}
            </a>
          </div>
        </div>

        {/* Right Column: HTML/CSS Mockup Card */}
        <div className="flex-1 w-full max-w-xl lg:max-w-none">
          <div 
            data-testid="hero-mockup-card"
            className="relative rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            {/* Top Bar Window Controls */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/80 bg-slate-950/60">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-500">app.wrenchly.io/dashboard</span>
            </div>

            {/* Mockup Dashboard Content */}
            <div className="p-6 space-y-6">
              {/* Header inside mockup */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Active Work Orders</h3>
                  <p className="text-xs text-slate-400">Real-time status tracking</p>
                </div>
                <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  ● Live Sync
                </span>
              </div>

              {/* Mockup Work Order List */}
              <div className="space-y-3">
                {[
                  { id: "WO-8492", client: "Apex Automotive", status: "In Progress", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
                  { id: "WO-8493", client: "Vortex Mechanics", status: "Completed", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
                  { id: "WO-8494", client: "Starlight Logistics", status: "Scheduled", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
                ].map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-mono text-xs font-bold text-blue-400">
                        {item.id.slice(-2)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-200">{item.client}</p>
                        <p className="text-[11px] font-mono text-slate-500">{item.id}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-md border font-medium ${item.color}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
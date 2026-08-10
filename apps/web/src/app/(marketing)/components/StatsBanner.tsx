import React from 'react';

export interface StatItem {
  id?: string;
  value: string;
  label: string;
  description?: string;
}

export interface StatsBannerProps {
  stats?: StatItem[];
  title?: string;
}

const defaultStats: StatItem[] = [
  {
    id: 'stat-1',
    value: '99.9%',
    label: 'Uptime SLA',
    description: 'Enterprise reliability for mission-critical repair ops'
  },
  {
    id: 'stat-2',
    value: '10k+',
    label: 'Work Orders Processed',
    description: 'Automated repair workflows handled seamlessly'
  },
  {
    id: 'stat-3',
    value: '45%',
    label: 'Efficiency Boost',
    description: 'Average time saved per technician daily'
  },
  {
    id: 'stat-4',
    value: '24/7',
    label: 'Dedicated Support',
    description: 'Expert guidance whenever you need it'
  }
];

export const StatsBanner: React.FC<StatsBannerProps> = ({
  stats = defaultStats,
  title
}) => {
  return (
    <section 
      data-testid="stats-banner"
      className="bg-slate-900 border-y border-slate-800 text-slate-100 py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto space-y-10">
        {title && (
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {title}
            </h2>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div
              key={stat.id || `stat-${idx}`}
              data-testid={`stat-item-${idx}`}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-950/50 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700/80 transition-all duration-200"
            >
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent font-mono mb-2">
                {stat.value}
              </div>
              <div className="text-base font-semibold text-slate-200 mb-1">
                {stat.label}
              </div>
              {stat.description && (
                <p className="text-xs text-slate-400 max-w-xs font-normal leading-relaxed">
                  {stat.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBanner;
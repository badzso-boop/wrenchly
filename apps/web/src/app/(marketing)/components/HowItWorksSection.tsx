import React from 'react';

export interface TimelineStep {
  stepNumber: number;
  title: string;
  description: string;
  icon?: string;
}

const DEFAULT_STEPS: TimelineStep[] = [
  {
    stepNumber: 1,
    title: 'Register & Add Items',
    description: 'Create your account and catalog your equipment, vehicles, or appliances with custom properties.',
  },
  {
    stepNumber: 2,
    title: 'Schedule & Log Maintenance',
    description: 'Set up recurring maintenance schedules, record service logs, attach receipts, and assign tasks.',
  },
  {
    stepNumber: 3,
    title: 'Track & Optimize',
    description: 'Monitor repair histories, track expenses, receive timely reminders, and optimize equipment lifespan.',
  },
];

export interface HowItWorksSectionProps {
  steps?: TimelineStep[];
  title?: string;
  subtitle?: string;
}

export function HowItWorksSection({
  steps = DEFAULT_STEPS,
  title = 'How It Works',
  subtitle = 'Get started with Wrenchly in three simple steps and take full control of your equipment maintenance.',
}: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {subtitle}
          </p>
        </div>

        <div className="relative">
          {/* Timeline connecting line for desktop */}
          <div
            className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step) => (
              <div
                key={step.stepNumber}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center text-center"
                data-testid={`how-it-works-step-${step.stepNumber}`}
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mb-4 shadow-md">
                  {step.stepNumber}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
import React from 'react';

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingSectionProps {
  title?: string;
  subtitle?: string;
  tierName?: string;
  tierPrice?: string;
  tierPeriod?: string;
  tierDescription?: string;
  features?: string[];
  buttonText?: string;
  buttonHref?: string;
}

const DEFAULT_FEATURES: string[] = [
  '100% Free & Open Source',
  'Unlimited Items & Maintenance Logs',
  'Self-Hosted with Full Data Privacy',
  'Custom Item Types & Custom Fields',
  'Recurring Service Reminders & Notifications',
  'Export & Backup Data Anytime',
];

export function PricingSection({
  title = 'Simple, Transparent Pricing',
  subtitle = 'Wrenchly is designed to be free and open-source for self-hosters.',
  tierName = 'Free Self-Hosted',
  tierPrice = '$0',
  tierPeriod = 'forever',
  tierDescription = 'Everything you need to manage your personal or home maintenance equipment on your own infrastructure.',
  features = DEFAULT_FEATURES,
  buttonText = 'Get Started for Free',
  buttonHref = '/auth/register',
}: PricingSectionProps) {
  return (
    <section id="pricing" className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {subtitle}
          </p>
        </div>

        <div className="flex justify-center">
          <div
            id="pricing-card-free"
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border-2 border-indigo-500 shadow-xl p-8 flex flex-col justify-between relative overflow-hidden"
            data-testid="pricing-card-free"
          >
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
              Popular
            </div>

            <div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tierName}
                </h3>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                    {tierPrice}
                  </span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    /{tierPeriod}
                  </span>
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  {tierDescription}
                </p>
              </div>

              <ul className="mt-6 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-indigo-500 mr-3 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <a
                href={buttonHref}
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 shadow-md text-center"
              >
                {buttonText}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
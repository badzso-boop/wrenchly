"use client";

import Link from "next/link";

export interface CTASectionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

export function CTASection({
  title = "Ready to Turbocharge Your Auto Shop Operations?",
  description = "Join thousands of mechanic shops streamlining scheduling, estimates, and payments with Wrenchly today.",
  primaryButtonText = "Start Free 14-Day Trial",
  primaryButtonHref = "/register",
  secondaryButtonText = "Book a Demo",
  secondaryButtonHref = "/demo",
}: CTASectionProps) {
  return (
    <section className="w-full py-16 bg-indigo-600 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl mb-4">
          {title}
        </h2>
        <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={primaryButtonHref}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors shadow"
          >
            {primaryButtonText}
          </Link>
          {secondaryButtonText && secondaryButtonHref && (
            <Link
              href={secondaryButtonHref}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-indigo-700 transition-colors"
            >
              {secondaryButtonText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default CTASection;
"use client";

import { useState } from "react";

export interface FAQItem {
  question: string;
  answer: string;
}

export const faqItems: FAQItem[] = [
  {
    question: "What is Wrenchly?",
    answer: "Wrenchly is a comprehensive auto repair shop management software designed to streamline invoicing, scheduling, customer communications, and inventory tracking."
  },
  {
    question: "How does the free trial work?",
    answer: "You get full access to all Wrenchly features for 14 days without entering payment details. At the end of the trial, you can choose a subscription plan."
  },
  {
    question: "Can I import data from my existing management software?",
    answer: "Yes, Wrenchly supports seamless data migration from major auto repair software tools via CSV imports and direct integrations."
  },
  {
    question: "Is Wrenchly mobile-friendly?",
    answer: "Absolutely. Wrenchly is optimized for smartphones, tablets, and desktop devices so technicians can use it right from the service bay."
  },
  {
    question: "How secure is my shop's customer and repair data?",
    answer: "We use bank-grade 256-bit SSL encryption, regular automated backups, and strict security compliance standards to keep your data safe."
  },
  {
    question: "Can I manage multiple shop locations?",
    answer: "Yes, Wrenchly Multi-Shop plans allow centralized management, reporting, and staff access control across multiple locations."
  },
  {
    question: "Does Wrenchly integrate with accounting tools like QuickBooks?",
    answer: "Yes, Wrenchly offers seamless two-way synchronization with QuickBooks Online, Xero, and major payment gateways."
  },
  {
    question: "How are digital vehicle inspections (DVI) handled?",
    answer: "Technicians can create visual inspection reports, attach photos/videos, and send interactive SMS/email reports directly to vehicle owners."
  },
  {
    question: "What support options are available?",
    answer: "We offer 24/7 live chat support, dedicated account onboarding managers, and extensive video documentation."
  },
  {
    question: "Can customers approve work estimates online?",
    answer: "Yes, customers receive a secure digital link where they can review estimates, view photos, and approve repairs with a digital signature."
  },
  {
    question: "Are there any long-term contracts or cancellation fees?",
    answer: "No contracts required. All Wrenchly plans are billed month-to-month or annually, and you can cancel anytime without penalties."
  },
  {
    question: "How do updates and new features work?",
    answer: "All feature updates, bug fixes, and security patches are automatically deployed to your cloud account at no extra charge."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="w-full py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Have questions about Wrenchly? Find answers to common questions below.
          </p>
        </div>

        <div className="space-y-4" data-testid="faq-accordion-list">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {item.question}
                  </span>
                  <span className="ml-6 flex-shrink-0 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    className="px-6 pb-4 text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700/50 pt-3"
                  >
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
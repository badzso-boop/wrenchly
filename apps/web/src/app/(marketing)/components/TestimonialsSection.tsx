import React from 'react';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  content: string;
  rating: number;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    role: 'Home Workshop Enthusiast',
    content: 'Wrenchly completely transformed how I keep track of maintenance across my cars, lawn mower, and power tools. Never missed an oil change since!',
    rating: 5,
  },
  {
    id: '2',
    name: 'Sarah Chen',
    role: 'Fleet & Facility Owner',
    content: 'The self-hosted tier is incredible. Having complete data privacy while maintaining a complete audit trail for commercial equipment is unbeatable.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Marcus Vance',
    role: 'DIY Mechanic',
    content: 'Clean interface, simple tracking, and reliable reminders. It is rare to find software built so specifically for equipment care.',
    rating: 5,
  },
];

export interface TestimonialsSectionProps {
  testimonials?: Testimonial[];
  title?: string;
  subtitle?: string;
}

export function TestimonialsSection({
  testimonials = DEFAULT_TESTIMONIALS,
  title = 'Loved by Creators & Caretakers',
  subtitle = 'See how Wrenchly helps users stay on top of maintenance for their tools, vehicles, and equipment.',
}: TestimonialsSectionProps) {
  return (
    <section id="testimonials" className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between"
              data-testid={`testimonial-card-${testimonial.id}`}
            >
              <div>
                <div
                  className="flex items-center space-x-1 mb-4"
                  data-testid={`rating-stars-${testimonial.id}`}
                  aria-label={`Rating: ${testimonial.rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <svg
                      key={index}
                      className={`w-5 h-5 ${
                        index < testimonial.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6 italic">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shrink-0">
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    testimonial.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
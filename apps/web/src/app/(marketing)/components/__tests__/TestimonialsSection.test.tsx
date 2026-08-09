import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestimonialsSection } from '../TestimonialsSection';

describe('TestimonialsSection', () => {
  it('renders section with correct id', () => {
    const { container } = render(<TestimonialsSection />);
    const section = container.querySelector('section#testimonials');
    expect(section).not.toBeNull();
  });

  it('renders rating stars and testimonial cards', () => {
    render(<TestimonialsSection />);
    expect(screen.getByTestId('testimonial-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('testimonial-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('testimonial-card-3')).toBeInTheDocument();

    expect(screen.getByTestId('rating-stars-1')).toBeInTheDocument();
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
  });

  it('allows custom testimonials to be passed', () => {
    const customTestimonials = [
      {
        id: '100',
        name: 'Jane Doe',
        role: 'Engineer',
        content: 'Awesome software for equipment tracking.',
        rating: 4,
      },
    ];
    render(<TestimonialsSection testimonials={customTestimonials} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Awesome software for equipment tracking.')).toBeInTheDocument();
    expect(screen.getByTestId('rating-stars-100')).toBeInTheDocument();
  });
});
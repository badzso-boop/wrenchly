import React from 'react';
import { render, screen } from '@testing-library/react';
import { HeroSection } from './HeroSection';

describe('HeroSection Component', () => {
  it('renders default hero section with title, subtitle, CTA buttons, and UI mockup card', () => {
    render(<HeroSection />);

    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Streamline Your Business Operations with Wrenchly/i);
    
    const primaryCta = screen.getByTestId('hero-primary-cta');
    expect(primaryCta).toHaveTextContent('Get Started Free');
    expect(primaryCta).toHaveAttribute('href', '/register');

    const secondaryCta = screen.getByTestId('hero-secondary-cta');
    expect(secondaryCta).toHaveTextContent('Book a Demo');
    expect(secondaryCta).toHaveAttribute('href', '/demo');

    expect(screen.getByTestId('hero-mockup-card')).toBeInTheDocument();
    expect(screen.getByText('app.wrenchly.io/dashboard')).toBeInTheDocument();
    expect(screen.getByText('Active Work Orders')).toBeInTheDocument();
  });

  it('renders custom props correctly', () => {
    render(
      <HeroSection
        title="Custom Hero Title"
        subtitle="Custom subtitle text for marketing"
        primaryCtaText="Join Now"
        primaryCtaHref="/signup"
        secondaryCtaText="Contact Sales"
        secondaryCtaHref="/contact"
        badgeText="Beta Release"
      />
    );

    expect(screen.getByText('Custom Hero Title')).toBeInTheDocument();
    expect(screen.getByText('Custom subtitle text for marketing')).toBeInTheDocument();
    expect(screen.getByText('Beta Release')).toBeInTheDocument();

    const primaryCta = screen.getByTestId('hero-primary-cta');
    expect(primaryCta).toHaveTextContent('Join Now');
    expect(primaryCta).toHaveAttribute('href', '/signup');

    const secondaryCta = screen.getByTestId('hero-secondary-cta');
    expect(secondaryCta).toHaveTextContent('Contact Sales');
    expect(secondaryCta).toHaveAttribute('href', '/contact');
  });
});
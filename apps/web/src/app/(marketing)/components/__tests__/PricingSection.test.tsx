import React from 'react';
import { render, screen } from '@testing-library/react';
import { PricingSection } from '../PricingSection';

describe('PricingSection', () => {
  it('renders section with id="pricing"', () => {
    const { container } = render(<PricingSection />);
    const section = container.querySelector('section#pricing');
    expect(section).not.toBeNull();
  });

  it('renders single centered card highlighting free self-hosted tier', () => {
    render(<PricingSection />);
    expect(screen.getByTestId('pricing-card-free')).toBeInTheDocument();
    expect(screen.getByText('Free Self-Hosted')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('100% Free & Open Source')).toBeInTheDocument();
  });

  it('allows custom props for pricing section', () => {
    render(
      <PricingSection
        tierName="Community Tier"
        tierPrice="Free"
        features={['Custom Feature 1']}
      />
    );
    expect(screen.getByText('Community Tier')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Custom Feature 1')).toBeInTheDocument();
  });
});
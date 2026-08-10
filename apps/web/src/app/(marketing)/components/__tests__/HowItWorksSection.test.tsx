import React from 'react';
import { render, screen } from '@testing-library/react';
import { HowItWorksSection } from '../HowItWorksSection';

describe('HowItWorksSection', () => {
  it('renders section with correct id', () => {
    const { container } = render(<HowItWorksSection />);
    const section = container.querySelector('section#how-it-works');
    expect(section).not.toBeNull();
  });

  it('renders 3 timeline steps', () => {
    render(<HowItWorksSection />);
    expect(screen.getByTestId('how-it-works-step-1')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works-step-2')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works-step-3')).toBeInTheDocument();
  });

  it('renders step titles and descriptions', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('Register & Add Items')).toBeInTheDocument();
    expect(screen.getByText('Schedule & Log Maintenance')).toBeInTheDocument();
    expect(screen.getByText('Track & Optimize')).toBeInTheDocument();
  });

  it('allows custom steps to be passed', () => {
    const customSteps = [
      { stepNumber: 1, title: 'Step One', description: 'First step description' },
    ];
    render(<HowItWorksSection steps={customSteps} />);
    expect(screen.getByText('Step One')).toBeInTheDocument();
    expect(screen.getByText('First step description')).toBeInTheDocument();
  });
});
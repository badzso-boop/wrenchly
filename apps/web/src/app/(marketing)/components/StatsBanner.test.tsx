import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatsBanner } from './StatsBanner';

describe('StatsBanner Component', () => {
  it('renders default statistics counters', () => {
    render(<StatsBanner />);

    expect(screen.getByTestId('stats-banner')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
    expect(screen.getByText('Uptime SLA')).toBeInTheDocument();
    expect(screen.getByText('10k+')).toBeInTheDocument();
    expect(screen.getByText('Work Orders Processed')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
  });

  it('renders custom title and custom stat items', () => {
    const customStats = [
      { id: '1', value: '500+', label: 'Active Users', description: 'Across 15 countries' },
      { id: '2', value: '99%', label: 'Satisfaction Rate', description: 'Based on customer surveys' },
    ];

    render(<StatsBanner title="Trusted Worldwide" stats={customStats} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Trusted Worldwide');
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('Across 15 countries')).toBeInTheDocument();

    expect(screen.getByText('99%')).toBeInTheDocument();
    expect(screen.getByText('Satisfaction Rate')).toBeInTheDocument();
    expect(screen.getByText('Based on customer surveys')).toBeInTheDocument();
  });
});
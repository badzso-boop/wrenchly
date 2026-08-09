import React from 'react';
import { render, screen } from '@testing-library/react';
import { ItemTypesSection } from '../ItemTypesSection';

describe('ItemTypesSection', () => {
  it('renders section with correct id', () => {
    const { container } = render(<ItemTypesSection />);
    const section = container.querySelector('section#item-types');
    expect(section).not.toBeNull();
  });

  it('renders 12 default item types', () => {
    render(<ItemTypesSection />);
    const items = [
      'Car',
      'Motorcycle',
      'Bicycle',
      'Lawn Mower',
      'Generator',
      'Power Tool',
      'HVAC Unit',
      'Home Appliance',
      'Boat Engine',
      'Agricultural Equipment',
      'Commercial Equipment',
      'Electronics',
    ];

    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('renders custom item types card', () => {
    render(<ItemTypesSection />);
    expect(screen.getByText('Custom Item Types')).toBeInTheDocument();
    expect(screen.getByTestId('custom-item-type-card')).toBeInTheDocument();
  });

  it('allows custom item types to be passed', () => {
    const customTypes = [
      { id: '101', name: 'Custom Drone', description: 'Quadcopter repair' },
    ];
    render(<ItemTypesSection itemTypes={customTypes} />);
    expect(screen.getByText('Custom Drone')).toBeInTheDocument();
    expect(screen.getByText('Quadcopter repair')).toBeInTheDocument();
  });
});
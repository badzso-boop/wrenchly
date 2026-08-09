import { describe, it, expect } from 'vitest';
import React from 'react';
import { TestimonialsSection } from '@/app/(marketing)/components/TestimonialsSection';
import { PricingSection } from '@/app/(marketing)/components/PricingSection';

describe('TestimonialsSection & PricingSection Unit Tests', () => {
  describe('TestimonialsSection', () => {
    it('creates TestimonialsSection element with default props and id="testimonials"', () => {
      const element = React.createElement(TestimonialsSection, {});
      expect(element.type).toBe(TestimonialsSection);
      expect(element.props).toEqual({});

      // Render JSX element tree via component call to verify structure & default state
      const vnode = TestimonialsSection({});
      expect(vnode.props.id).toBe('testimonials');

      const containerDiv = vnode.props.children;
      const contentWrapper = containerDiv.props.children;
      const [headerDiv, gridDiv] = contentWrapper.props.children;

      // Header assertions
      const [titleH2, subtitleP] = headerDiv.props.children;
      expect(titleH2.props.children).toBe('Loved by Creators & Caretakers');
      expect(subtitleP.props.children).toBe(
        'See how Wrenchly helps users stay on top of maintenance for their tools, vehicles, and equipment.'
      );

      // Grid testimonials assertions (3 default cards)
      const cards = gridDiv.props.children;
      expect(cards.length).toBe(3);
      expect(cards[0].props['data-testid']).toBe('testimonial-card-1');
      expect(cards[1].props['data-testid']).toBe('testimonial-card-2');
      expect(cards[2].props['data-testid']).toBe('testimonial-card-3');
    });

    it('renders rating stars correctly per testimonial rating', () => {
      const customTestimonials = [
        {
          id: 't-1',
          name: 'Jane Doe',
          role: 'Fleet Owner',
          content: 'Great app',
          rating: 4,
        },
      ];

      const vnode = TestimonialsSection({ testimonials: customTestimonials });
      const containerDiv = vnode.props.children;
      const contentWrapper = containerDiv.props.children;
      const [, gridDiv] = contentWrapper.props.children;
      const cards = gridDiv.props.children;

      expect(cards.length).toBe(1);
      const card = cards[0];
      expect(card.props['data-testid']).toBe('testimonial-card-t-1');

      const cardBody = card.props.children[0];
      const ratingContainer = cardBody.props.children[0];
      expect(ratingContainer.props['data-testid']).toBe('rating-stars-t-1');

      const stars = ratingContainer.props.children;
      expect(stars.length).toBe(5);

      // 4 yellow filled stars and 1 muted star
      expect(stars[0].props.className).toContain('text-yellow-400');
      expect(stars[1].props.className).toContain('text-yellow-400');
      expect(stars[2].props.className).toContain('text-yellow-400');
      expect(stars[3].props.className).toContain('text-yellow-400');
      expect(stars[4].props.className).toContain('text-gray-300');
    });
  });

  describe('PricingSection', () => {
    it('creates PricingSection element with id="pricing" and default self-hosted free tier', () => {
      const element = React.createElement(PricingSection, {});
      expect(element.type).toBe(PricingSection);

      const vnode = PricingSection({});
      expect(vnode.props.id).toBe('pricing');

      const containerDiv = vnode.props.children;
      const contentWrapper = containerDiv.props.children;
      const [headerDiv, cardWrapperDiv] = contentWrapper.props.children;

      // Header assertions
      const [titleH2, subtitleP] = headerDiv.props.children;
      expect(titleH2.props.children).toBe('Simple, Transparent Pricing');
      expect(subtitleP.props.children).toBe(
        'Wrenchly is designed to be free and open-source for self-hosters.'
      );

      // Card wrapper and single card assertions
      const card = cardWrapperDiv.props.children;
      expect(card.props.id).toBe('pricing-card-free');
      expect(card.props['data-testid']).toBe('pricing-card-free');

      const cardContent = card.props.children[1];
      const cardHeader = cardContent.props.children[0];
      const tierNameH3 = cardHeader.props.children[0];
      const priceDiv = cardHeader.props.children[1];

      expect(tierNameH3.props.children).toBe('Free Self-Hosted');
      expect(priceDiv.props.children[0].props.children).toBe('$0');
      expect(priceDiv.props.children[1].props.children).toEqual(['/', 'forever']);
    });

    it('allows customizing title, tierName, price, and features list', () => {
      const customFeatures = ['Unlimited Items', 'Self-Hosted Privacy'];
      const vnode = PricingSection({
        title: 'Community Edition',
        tierName: 'Self-Hosted PRO',
        tierPrice: '$0',
        features: customFeatures,
      });

      const containerDiv = vnode.props.children;
      const contentWrapper = containerDiv.props.children;
      const [headerDiv, cardWrapperDiv] = contentWrapper.props.children;

      expect(headerDiv.props.children[0].props.children).toBe('Community Edition');

      const card = cardWrapperDiv.props.children;
      const cardContent = card.props.children[1];
      const featureList = cardContent.props.children[1];

      expect(featureList.props.children.length).toBe(2);
      expect(featureList.props.children[0].props.children[1].props.children).toBe('Unlimited Items');
      expect(featureList.props.children[1].props.children[1].props.children).toBe('Self-Hosted Privacy');
    });
  });
});
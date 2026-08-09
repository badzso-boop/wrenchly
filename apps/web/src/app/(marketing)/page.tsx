import type { Metadata } from "next";
import LandingNav from "./components/LandingNav";
import HeroSection from "./components/HeroSection";
import StatsBanner from "./components/StatsBanner";
import FeaturesSection from "./components/FeaturesSection";
import HowItWorksSection from "./components/HowItWorksSection";
import ItemTypesSection from "./components/ItemTypesSection";
import TestimonialsSection from "./components/TestimonialsSection";
import PricingSection from "./components/PricingSection";
import FAQSection from "./components/FAQSection";
import CTASection from "./components/CTASection";
import LandingFooter from "./components/LandingFooter";

export const metadata: Metadata = {
  title: "Wrenchly - Streamline Your Business & Equipment Operations",
  description: "The all-in-one maintenance and shop management platform for modern service teams, repair shops, and creators.",
};

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <LandingNav />
      <main>
        <HeroSection />
        <StatsBanner />
        <FeaturesSection />
        <HowItWorksSection />
        <ItemTypesSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
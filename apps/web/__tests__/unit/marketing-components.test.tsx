import { render, screen, fireEvent } from "@testing-library/react";
import FAQSection, { faqItems } from "../../src/app/(marketing)/components/FAQSection";
import CTASection from "../../src/app/(marketing)/components/CTASection";
import LandingFooter from "../../src/app/(marketing)/components/LandingFooter";

describe("Marketing Components", () => {
  describe("FAQSection", () => {
    it("renders section with id='faq'", () => {
      const { container } = render(<FAQSection />);
      const section = container.querySelector("section#faq");
      expect(section).toBeInTheDocument();
    });

    it("renders exactly 12 FAQ questions", () => {
      render(<FAQSection />);
      expect(faqItems).toHaveLength(12);
      
      faqItems.forEach((item) => {
        expect(screen.getByText(item.question)).toBeInTheDocument();
      });
    });

    it("toggles item open and closed when clicking question button", () => {
      render(<FAQSection />);
      const firstQuestionText = faqItems[0].question;
      const firstAnswerText = faqItems[0].answer;

      expect(screen.queryByText(firstAnswerText)).not.toBeInTheDocument();

      const button = screen.getByText(firstQuestionText);
      fireEvent.click(button);

      expect(screen.getByText(firstAnswerText)).toBeInTheDocument();

      fireEvent.click(button);

      expect(screen.queryByText(firstAnswerText)).not.toBeInTheDocument();
    });
  });

  describe("CTASection", () => {
    it("renders call to action title and links", () => {
      render(<CTASection />);
      expect(
        screen.getByRole("heading", { name: /ready to turbocharge your auto shop operations\?/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /start free 14-day trial/i })).toHaveAttribute(
        "href",
        "/register"
      );
      expect(screen.getByRole("link", { name: /book a demo/i })).toHaveAttribute(
        "href",
        "/demo"
      );
    });

    it("accepts custom title and props", () => {
      render(
        <CTASection
          title="Custom CTA Header"
          primaryButtonText="Join Now"
          primaryButtonHref="/signup"
        />
      );
      expect(screen.getByRole("heading", { name: "Custom CTA Header" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Join Now" })).toHaveAttribute("href", "/signup");
    });
  });

  describe("LandingFooter", () => {
    it("renders footer brand and links", () => {
      render(<LandingFooter />);
      expect(screen.getByText("Wrenchly")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute("href", "#features");
      expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "#pricing");
      expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "#faq");
      expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
      expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
    });
  });
});
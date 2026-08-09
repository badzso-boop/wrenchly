import { describe, it, expect } from "vitest";
import { FEATURES } from "../../../src/app/(marketing)/components/FeaturesSection";

describe("FeaturesSection", () => {
  it("defines exactly 6 core features", () => {
    expect(FEATURES).toHaveLength(6);
  });

  it("includes expected feature titles and valid Lucide icons", () => {
    const titles = FEATURES.map((f) => f.title);
    expect(titles).toContain("Smart Work Order Management");
    expect(titles).toContain("Automated Scheduling");
    expect(titles).toContain("Customer & Fleet Portal");
    expect(titles).toContain("Compliance & Safety Audits");
    expect(titles).toContain("Real-Time Analytics & Reporting");
    expect(titles).toContain("Instant Notifications & Alerts");

    FEATURES.forEach((feature) => {
      expect(feature.icon).toBeDefined();
      expect(feature.title.length).toBeGreaterThan(0);
      expect(feature.description.length).toBeGreaterThan(0);
    });
  });
});
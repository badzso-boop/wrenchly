import { describe, it, expect } from "vitest";
import { NAV_LINKS, LandingNav } from "../../../src/app/(marketing)/components/LandingNav";

describe("LandingNav", () => {
  it("defines standard navigation links for landing sections", () => {
    expect(NAV_LINKS).toEqual([
      { href: "#features", label: "Features" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#item-types", label: "Item Types" },
      { href: "#faq", label: "FAQ" },
    ]);
  });

  it("exports LandingNav client component function", () => {
    expect(typeof LandingNav).toBe("function");
  });
});
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Wrench, Menu, X } from "lucide-react";

export interface NAV_LINK {
  href: string;
  label: string;
}

export const NAV_LINKS: NAV_LINK[] = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#item-types", label: "Item Types" },
  { href: "#faq", label: "FAQ" },
];

export interface LandingNavProps {
  isLoggedIn?: boolean;
}

export function LandingNav({ isLoggedIn = false }: LandingNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      data-testid="landing-nav-header"
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[oklch(0.10_0.015_262)]/80 backdrop-blur-md border-b border-white/10 shadow-lg"
          : "bg-[oklch(0.10_0.015_262)] border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-3 text-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.546_0.245_262.88)] rounded-md"
          >
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.546_0.245_262.88)] flex items-center justify-center shadow-md">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              wrenchly
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Auth Aware Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[oklch(0.546_0.245_262.88)] hover:bg-[oklch(0.65_0.2_262.88)] rounded-lg transition-colors shadow-sm"
              >
                Open Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[oklch(0.546_0.245_262.88)] hover:bg-[oklch(0.65_0.2_262.88)] rounded-lg transition-colors shadow-sm"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          data-testid="mobile-menu"
          className="md:hidden bg-[oklch(0.12_0.015_262)] border-b border-white/10 px-4 pt-2 pb-6 space-y-4"
        >
          <nav className="flex flex-col space-y-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-gray-200 hover:text-white py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-white/10 flex flex-col space-y-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-[oklch(0.546_0.245_262.88)] hover:bg-[oklch(0.65_0.2_262.88)] rounded-lg transition-colors"
              >
                Open Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-[oklch(0.546_0.245_262.88)] hover:bg-[oklch(0.65_0.2_262.88)] rounded-lg transition-colors"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default LandingNav;
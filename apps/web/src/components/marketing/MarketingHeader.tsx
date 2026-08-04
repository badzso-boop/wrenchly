'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { cn } from '@/lib/utils'

export function MarketingHeader() {
  return (
    <header className={cn(
      'sticky top-0 z-40 w-full',
      'bg-background border-b border-border',
      'supports-[backdrop-filter]:bg-background/95 supports-[backdrop-filter]:backdrop-blur-sm'
    )}>
      <nav className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-foreground hover:text-foreground/80 transition-colors shrink-0"
        >
          <div className="flex items-center gap-1">
            <span className="text-primary">⚙</span>
            <span>Wrenchly</span>
          </div>
        </Link>

        {/* Center nav links - hidden on small screens */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How it works
          </a>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>
            Sign in
          </Button>
          <Button variant="default" size="sm" render={<Link href="/register" />} nativeButton={false}>
            Get started
          </Button>
        </div>
      </nav>
    </header>
  )
}

import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { Wrench } from 'lucide-react'

export function MarketingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Content */}
        <div className="mb-8 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Branding */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <Wrench className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">Wrenchly</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Cross-domain maintenance tracker
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-3 text-sm">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Create account
            </Link>
          </nav>
        </div>

        {/* Separator */}
        <Separator className="my-8" />

        {/* Copyright */}
        <div className="text-center text-sm text-muted-foreground">
          © {currentYear} Wrenchly. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

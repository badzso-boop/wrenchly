import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { finalCta } from '@/content/landing'

export function CallToAction() {
  return (
    <section className="w-full py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-muted/40 px-6 py-16 text-center sm:px-8">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {finalCta.title}
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            {finalCta.description}
          </p>
          <Button asChild>
            <Link href={finalCta.cta.href}>
              {finalCta.cta.label}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

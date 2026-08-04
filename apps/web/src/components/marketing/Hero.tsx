import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { heroContent } from '@/content/landing'

export function Hero() {
  return (
    <section className="relative w-full py-20 sm:py-28 overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-6 text-center">
        {/* Eyebrow badge */}
        <Badge variant="secondary">{heroContent.eyebrow}</Badge>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
          {heroContent.title}
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
          {heroContent.subtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button size="lg" render={<Link href={heroContent.primaryCta.href} />} nativeButton={false}>
            {heroContent.primaryCta.label}
          </Button>
          <Button variant="outline" size="lg" render={<Link href={heroContent.secondaryCta.href} />} nativeButton={false}>
            {heroContent.secondaryCta.label}
          </Button>
        </div>
      </div>
    </section>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { Hero } from '@/components/marketing/Hero'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { CallToAction } from '@/components/marketing/CallToAction'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

export const metadata: Metadata = {
  title: 'Wrenchly – Cross-domain karbantartás-nyilvántartó',
  description:
    'Wrenchly egy helyen tartja a járműveid, eszközeid és otthonod karbantartási naplóját, emlékeztetőit és költségeit.',
  openGraph: {
    title: 'Wrenchly – Cross-domain karbantartás-nyilvántartó',
    description:
      'Wrenchly egy helyen tartja a járműveid, eszközeid és otthonod karbantartási naplóját, emlékeztetőit és költségeit.',
    type: 'website',
  },
}

export default async function HomePage() {
  const session = await getServerSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <MarketingHeader />
      <main>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Hero />
          <FeatureGrid />
          <HowItWorks />
          <CallToAction />
        </div>
      </main>
      <MarketingFooter />
    </div>
  )
}

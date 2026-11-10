import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { TRPCProvider } from '@/components/providers/TRPCProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'

// Self-hosted Umami, cookieless — inert until NEXT_PUBLIC_UMAMI_WEBSITE_ID is set.
function UmamiAnalytics() {
  const id = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  if (!id) return null

  return <Script src="https://analytics.ujjweb.hu/script.js" data-website-id={id} strategy="afterInteractive" />
}

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Wrenchly – Maintenance Tracker',
  description: 'Track maintenance for everything you own',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <UmamiAnalytics />
        <ThemeProvider>
          <TRPCProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

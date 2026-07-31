'use client'
import { CustomDomainManager } from './CustomDomainManager'

export function CustomDomainsPageClient() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <h1 className="text-xl font-semibold">Custom Domains</h1>
        <p className="text-sm text-muted-foreground">Build your own item types and log widgets</p>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-lg mx-auto space-y-6">
          <CustomDomainManager />
        </div>
      </div>
    </div>
  )
}

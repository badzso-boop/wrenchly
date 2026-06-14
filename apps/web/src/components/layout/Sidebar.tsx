'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wrench, Package, Bell, Settings, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/trpc/client'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/items', label: 'My Items', icon: Wrench },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/notifications', label: 'Notifications', icon: Bell },
]

function NavLink({ href, label, icon: Icon, unreadCount }: { href: string; label: string; icon: React.ElementType; unreadCount?: number }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {unreadCount != null && unreadCount > 0 && (
        <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs">
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Link>
  )
}

function SidebarContent() {
  const unread = api.notification.countUnread.useQuery(undefined, { refetchInterval: 60_000 })

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Wrench className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-sidebar-foreground tracking-tight">Wrenchly</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            unreadCount={item.href === '/notifications' ? (unread.data ?? 0) : undefined}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-4 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile top bar + sheet */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4">
        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open menu" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
            <Wrench className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">Wrenchly</span>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </>
  )
}

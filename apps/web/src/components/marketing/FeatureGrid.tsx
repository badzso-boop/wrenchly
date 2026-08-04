import {
  Bell,
  Blocks,
  Calendar,
  ChefHat,
  CheckCheck,
  LineChart,
  Package,
  Printer,
  Route,
  Share2,
  ShoppingCart,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { features } from '@/content/landing'

const iconMap: Record<string, LucideIcon> = {
  Package,
  Wrench,
  Bell,
  ShoppingCart,
  Route,
  LineChart,
  Printer,
  ChefHat,
  Wallet,
  Blocks,
  Calendar,
  CheckCheck,
  Share2,
}

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Minden, amire szükséged van a karbantartáshoz
        </h2>
        <p className="mt-4 text-muted-foreground">
          Egy hely az összes tárgyad nyilvántartására, naplózására és emlékeztetőire.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = iconMap[feature.icon]

          return (
            <Card
              key={feature.id}
              className="border border-transparent transition-colors hover:border-primary/40"
            >
              <CardHeader>
                {Icon ? (
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                ) : null}
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

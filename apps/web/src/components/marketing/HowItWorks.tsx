import { howItWorks } from '@/content/landing'
import { Separator } from '@/components/ui/separator'

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Hogyan működik?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Négy egyszerű lépés, és már nyilvántarthatod a karbantartásokat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {howItWorks.map((step, index) => (
            <div key={step.step} className="flex flex-col">
              {/* Numbered circle badge */}
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                {step.step}
              </div>

              {/* Step title */}
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {step.title}
              </h3>

              {/* Step description */}
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {step.description}
              </p>

              {/* Separator between steps on large screens */}
              {index < howItWorks.length - 1 && (
                <div className="hidden lg:flex items-center justify-center mt-6 h-12">
                  <Separator orientation="vertical" className="h-8" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

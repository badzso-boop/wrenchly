import React from "react";
import {
  Wrench,
  Calendar,
  Users,
  ShieldCheck,
  BarChart3,
  Bell,
} from "lucide-react";

export interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  className?: string;
}

export const FEATURES: Feature[] = [
  {
    icon: Wrench,
    title: "Smart Work Order Management",
    description:
      "Track repairs, maintenance schedules, and job status in real time with automated workflows.",
    badge: "Core",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    icon: Calendar,
    title: "Automated Scheduling",
    description:
      "Optimize dispatching and technician calendar management effortlessly.",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Users,
    title: "Customer & Fleet Portal",
    description:
      "Provide seamless service tracking and transparent communication for clients.",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Safety Audits",
    description:
      "Keep digital inspection logs and maintain compliance with industry standards.",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics & Reporting",
    description:
      "Gain insights into shop performance, inventory usage, and revenue metrics.",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    icon: Bell,
    title: "Instant Notifications & Alerts",
    description:
      "Receive real-time push and SMS updates on task progress and urgent alerts.",
    className: "md:col-span-3 md:row-span-1",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-background text-foreground">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to run your shop
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Empower your team with modern tools designed for efficiency, accuracy, and scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px]">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                data-testid={`feature-card-${index}`}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/50 ${
                  feature.className || ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    {feature.badge && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
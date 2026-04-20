import { Receipt, LayoutGrid, Boxes, BookOpen, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Receipt,
    title: "Order Management & Fast Billing",
    desc: "Error-free invoicing built for rush hours.",
    bullets: [
      "Real-time order tracking",
      "Automatic tax calculation",
      "Multiple payment methods",
    ],
    tone: "accent",
  },
  {
    icon: LayoutGrid,
    title: "Table Management & Reservations",
    desc: "See every table at a glance.",
    bullets: [
      "Live table availability",
      "Overbooking prevention",
      "Quick table additions",
    ],
    tone: "secondary",
  },
  {
    icon: Boxes,
    title: "Inventory & Recipe Management",
    desc: "Never run out of what sells.",
    bullets: [
      "Item-wise auto deduction",
      "Low-stock alerts",
      "Recipe & ingredient tracking",
    ],
    tone: "primary",
  },
  {
    icon: BookOpen,
    title: "Menu Management",
    desc: "Edit once, sync everywhere.",
    bullets: [
      "Real-time customization",
      "Seasonal menu planning",
      "Promotions & discounts",
    ],
    tone: "accent",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    desc: "Decisions backed by data.",
    bullets: [
      "Sales, cancels & takeaways",
      "Customer behavior insights",
      "Cost & wastage tracking",
    ],
    tone: "secondary",
  },
];

const toneMap = {
  accent:
    "bg-accent-soft text-accent group-hover:bg-gradient-accent group-hover:text-accent-foreground",
  secondary:
    "bg-secondary-soft text-secondary group-hover:bg-gradient-teal group-hover:text-secondary-foreground",
  primary:
    "bg-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground",
};

export const Features = () => (
  <section id="features" className="bg-muted/40 py-20 md:py-28">
    <div className="container">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-accent">
          Core Modules
        </span>
        <h2 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
          Everything your restaurant needs in one platform
        </h2>
        <p className="mt-4 text-muted-foreground">
          Built for QSRs, fine-dine, food courts and multi-outlet brands — from
          billing to back-office.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <article
            key={f.title}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-card ${
              i === 3 ? "lg:col-start-1 lg:col-end-3" : ""
            } ${i === 4 ? "lg:col-span-1" : ""}`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${toneMap[f.tone]}`}
            >
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-primary">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {f.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-foreground/80"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {b}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  </section>
);

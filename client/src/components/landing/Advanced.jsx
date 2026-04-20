import { CheckCircle2, Quote } from "lucide-react";

const capabilities = [
  "Third-Party App Integrations (Zomato, UberEats, Swiggy)",
  "Automatic Shift Close Reports",
  "Granular Employee Permissions & Roles",
  "Bulk SMS & WhatsApp Messaging",
  "Daily Expenditure Checks",
  "Customer Feedback Management",
  "Dedicated Takeaway & Delivery Tracking",
  "Multi-outlet Centralized Control",
  "GST & Multi-currency Support",
  "Offline Mode with Auto-sync",
];

export const Advanced = () => (
  <section id="advanced" className="py-20 md:py-28">
    <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
      <div>
        <span className="text-sm font-semibold uppercase tracking-wider text-secondary">
          Advanced Capabilities
        </span>
        <h2 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
          Enterprise-grade features, made simple
        </h2>
        <p className="mt-4 text-muted-foreground">
          Powerful tools that scale with your operation — from a single café to
          a 200-outlet chain.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {capabilities.map((c) => (
            <li
              key={c}
              className="flex items-start gap-2.5 text-sm text-foreground/85"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <aside className="relative rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-card md:p-10">
        <Quote className="h-10 w-10 text-accent" />
        <p className="mt-4 text-xl font-medium leading-relaxed">
          "RestoOS cut our billing time in half and gave us inventory clarity we
          never had. We rolled it out to 14 outlets in under a month."
        </p>
        <div className="mt-8 flex items-center gap-4 border-t border-white/15 pt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-accent text-lg font-bold">
            AR
          </div>
          <div>
            <p className="font-semibold">Aarav Reddy</p>
            <p className="text-sm text-white/70">
              COO · Spice Route Group (14 outlets)
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            ["+34%", "Faster billing"],
            ["-22%", "Food wastage"],
            ["+18%", "Repeat guests"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-white/10 p-3 backdrop-blur">
              <p className="text-lg font-bold text-accent">{v}</p>
              <p className="text-[11px] text-white/70">{l}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>

    <div className="container mt-20">
      <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Built for every format
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {[
          "QSR",
          "Fine Dine",
          "Food Court",
          "Cloud Kitchen",
          "Cafés & Bakeries",
          "Bars & Pubs",
          "Multi-outlet Chains",
        ].map((u) => (
          <span
            key={u}
            className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-primary shadow-soft transition hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent"
          >
            {u}
          </span>
        ))}
      </div>
    </div>
  </section>
);

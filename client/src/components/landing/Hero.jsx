import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  PlayCircle,
  Sparkles,
  TrendingUp,
  Receipt,
} from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
      <div className="absolute inset-0 grid-pattern opacity-60" />
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-secondary/30 blur-3xl" />

      <div className="container relative grid gap-14 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            All-in-one Restaurant OS · Trusted by 5,000+ outlets
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            Best Restaurant Software For{" "}
            <span className="bg-gradient-to-r from-accent to-[hsl(38_100%_65%)] bg-clip-text text-transparent">
              Billing, Orders, Inventory
            </span>{" "}
            & Reports.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/75">
            A flexible POS and restaurant management system that meets all your
            needs. Perfect for QSRs, Fine-Dine, Food Courts, and Multi-outlet
            businesses.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-accent text-accent-foreground shadow-glow hover:opacity-95"
            >
              Get a Free Demo <ArrowRight className="ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <a href="#features">
                <PlayCircle className="mr-1" /> View Features
              </a>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/60">
            <div>
              ⭐⭐⭐⭐⭐ <span className="text-white/80">4.9/5</span> · 1,200+
              reviews
            </div>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <div>No credit card · Setup in 24 hours</div>
          </div>
        </div>

        <div
          className="relative animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          <HeroMockup />
        </div>
      </div>
    </section>
  );
};

const HeroMockup = () => (
  <div className="relative mx-auto w-full max-w-[560px]">
    {/* Laptop */}
    <div className="rounded-t-2xl border border-white/15 bg-card p-3 shadow-card">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
      </div>
      <div className="rounded-lg bg-muted p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Today's Revenue
            </p>
            <p className="text-2xl font-bold text-primary">$12,847</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">
            <TrendingUp className="h-3 w-3" /> +18.4%
          </span>
        </div>
        <div className="mt-4 flex h-28 items-end gap-2">
          {[40, 65, 35, 80, 55, 92, 70, 88, 60, 95, 75, 100].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${h}%`,
                background:
                  i % 2 ? "hsl(var(--accent))" : "hsl(var(--secondary))",
              }}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-md bg-card p-2">
            <p className="font-bold text-primary">324</p>
            <p className="text-muted-foreground">Orders</p>
          </div>
          <div className="rounded-md bg-card p-2">
            <p className="font-bold text-primary">$39.6</p>
            <p className="text-muted-foreground">Avg Bill</p>
          </div>
          <div className="rounded-md bg-card p-2">
            <p className="font-bold text-primary">12</p>
            <p className="text-muted-foreground">Tables</p>
          </div>
        </div>
      </div>
    </div>
    <div className="mx-auto h-3 w-[110%] -translate-x-[5%] rounded-b-2xl bg-gradient-to-b from-white/20 to-white/5" />

    {/* Tablet floating */}
    <div className="absolute -bottom-10 -left-6 w-[230px] rotate-[-6deg] rounded-2xl border border-white/20 bg-card p-3 shadow-glow sm:-left-10 sm:w-[260px]">
      <div className="rounded-xl bg-primary p-3 text-primary-foreground">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Table 07</span>
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold">
            BILL
          </span>
        </div>
        <div className="mt-3 space-y-1.5 text-xs">
          {[
            ["Margherita Pizza", "$14.00"],
            ["Truffle Pasta", "$22.00"],
            ["Iced Latte ×2", "$9.00"],
          ].map(([n, p]) => (
            <div key={n} className="flex justify-between text-white/80">
              <span>{n}</span>
              <span>{p}</span>
            </div>
          ))}
          <div className="my-2 h-px bg-white/15" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>$45.00</span>
          </div>
        </div>
        <button className="mt-3 flex w-full items-center justify-center gap-1 rounded-md bg-gradient-accent py-2 text-xs font-bold">
          <Receipt className="h-3.5 w-3.5" /> Charge $45.00
        </button>
      </div>
    </div>
  </div>
);

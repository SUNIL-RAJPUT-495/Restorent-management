import {
  UtensilsCrossed,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const cols = [
  {
    title: "Modules",
    links: [
      "Billing & POS",
      "Inventory",
      "QSR",
      "Fine Dine",
      "Cloud Kitchen",
      "Reports",
    ],
  },
  {
    title: "Company",
    links: ["About Us", "Customers", "Careers", "Contact", "Press"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Security", "GDPR"],
  },
];

export const Footer = () => (
  <footer className="border-t border-border bg-primary text-primary-foreground">
    <div className="container py-16">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-accent text-accent-foreground">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            <span className="text-lg tracking-tight">RestoOS</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            The complete restaurant operating system — billing, orders,
            inventory, and analytics, beautifully unified.
          </p>
          <form className="mt-6 flex max-w-sm gap-2">
            <Input
              placeholder="you@restaurant.com"
              className="border-white/20 bg-white/5 text-white placeholder:text-white/50 focus-visible:ring-accent"
            />

            <Button
              type="submit"
              className="bg-gradient-accent text-accent-foreground hover:opacity-95"
            >
              Subscribe
            </Button>
          </form>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              {c.title}
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-white/70 transition hover:text-accent"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row">
        <p className="text-xs text-white/60">
          © {new Date().getFullYear()} RestoOS Inc. All rights reserved.
        </p>
        <div className="flex items-center gap-3">
          {[Twitter, Linkedin, Facebook, Instagram].map((Icon, i) => (
            <a
              key={i}
              href="#"
              aria-label="social"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

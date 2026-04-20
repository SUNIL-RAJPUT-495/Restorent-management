import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, UtensilsCrossed } from "lucide-react";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How It Works" },
  { href: "#dashboards", label: "Dashboards" },
  { href: "#advanced", label: "Capabilities" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-bold text-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-accent text-accent-foreground shadow-soft">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">RestoOS</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" className="text-primary hover:bg-muted">
            Sign in
          </Button>
          <Button className="bg-gradient-accent text-accent-foreground shadow-soft hover:opacity-95">
            Get a Free Demo
          </Button>
        </div>

        <button
          className="md:hidden text-primary"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container flex flex-col gap-4 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                {l.label}
              </a>
            ))}
            <Button className="bg-gradient-accent text-accent-foreground">
              Get a Free Demo
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

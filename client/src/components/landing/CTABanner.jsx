import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const CTABanner = () => (
  <section className="py-16 md:py-20">
    <div className="container">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center text-primary-foreground shadow-card md:p-16">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute -top-20 -right-10 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold md:text-4xl">
            Ready to transform your restaurant?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Join 5,000+ outlets running smoother shifts, smarter inventory, and
            stronger margins with RestoOS.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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
            >
              Talk to Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

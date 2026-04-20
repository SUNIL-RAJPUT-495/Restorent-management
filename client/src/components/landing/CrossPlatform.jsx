import {
  Monitor,
  Tablet,
  Globe,
  Settings2,
  GraduationCap,
  Rocket,
} from "lucide-react";

const devices = [
  { icon: Monitor, label: "Desktop", badges: ["Windows", "macOS", "Linux"] },
  { icon: Tablet, label: "Tablet & Mobile", badges: ["iOS", "Android"] },
  { icon: Globe, label: "Web Browser", badges: ["Chrome", "Safari", "Edge"] },
];

const steps = [
  {
    icon: Settings2,
    title: "Setup in minutes",
    desc: "Import menu, configure taxes, and connect printers — guided onboarding.",
  },
  {
    icon: GraduationCap,
    title: "Train your team",
    desc: "Intuitive POS interface — staff is productive on day one.",
  },
  {
    icon: Rocket,
    title: "Grow with insights",
    desc: "Real-time dashboards turn data into smarter decisions every shift.",
  },
];

export const CrossPlatform = () => (
  <section id="how" className="py-20 md:py-28">
    <div className="container">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-secondary">
          Cross-Platform
        </span>
        <h2 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
          Runs on any device, any browser, any OS
        </h2>
        <p className="mt-4 text-muted-foreground">
          No lock-in. Use the hardware you already have, or pair with our
          recommended devices.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {devices.map((d) => (
          <div
            key={d.label}
            className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft transition hover:shadow-card"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-hero text-primary-foreground">
              <d.icon className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-primary">{d.label}</h3>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {d.badges.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 grid gap-8 md:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="relative rounded-2xl border border-border bg-card p-7 shadow-soft"
          >
            <span className="absolute -top-3 left-7 rounded-full bg-gradient-accent px-3 py-1 text-xs font-bold text-accent-foreground">
              Step {i + 1}
            </span>
            <s.icon className="h-8 w-8 text-accent" />
            <h4 className="mt-3 text-lg font-bold text-primary">{s.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const stats = [
  { value: "5,000+", label: "Outlets served" },
  { value: "120M+", label: "Orders processed" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "28", label: "Countries" },
];

export const Stats = () => (
  <section className="border-b border-border bg-background">
    <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4 md:py-14">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <p className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
            {s.value}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  </section>
);

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  RotateCw,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend as RechartsLegend,
} from "recharts";

const tables = [
  { id: 1, status: "free" },
  { id: 2, status: "occupied", guests: 4, time: "42m" },
  { id: 3, status: "reserved", guests: 2, time: "7:30 PM" },
  { id: 4, status: "free" },
  { id: 5, status: "occupied", guests: 3, time: "18m" },
  { id: 6, status: "free" },
  { id: 7, status: "occupied", guests: 6, time: "1h 12m" },
  { id: 8, status: "reserved", guests: 4, time: "8:00 PM" },
  { id: 9, status: "free" },
  { id: 10, status: "occupied", guests: 2, time: "26m" },
  { id: 11, status: "free" },
  { id: 12, status: "occupied", guests: 5, time: "55m" },
];

const statusStyles = {
  free: "bg-success/10 border-success/40 text-success",
  occupied: "bg-destructive/10 border-destructive/40 text-destructive",
  reserved: "bg-warning/10 border-warning/40 text-warning",
};

const TableGrid = () => (
  <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-primary">
          Floor Plan · Main Hall
        </h3>
        <p className="text-sm text-muted-foreground">Real-time table status</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <Legend dot="success" label="Available" />
        <Legend dot="destructive" label="Occupied" />
        <Legend dot="warning" label="Reserved" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {tables.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl border-2 p-3 text-center transition hover:scale-[1.03] ${statusStyles[t.status]}`}
        >
          <p className="text-xs font-semibold opacity-75">Table</p>
          <p className="text-2xl font-extrabold text-foreground">
            {String(t.id).padStart(2, "0")}
          </p>
          {t.status !== "free" ? (
            <div className="mt-1 space-y-0.5 text-[11px] font-medium text-foreground/80">
              <span className="flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                {t.guests}
              </span>
              <span className="flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                {t.time}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-[11px] font-semibold uppercase">Free</p>
          )}
        </div>
      ))}
    </div>
  </div>
);

const Legend = ({ dot, label }) => (
  <span className="flex items-center gap-1.5 text-muted-foreground">
    <span className={`h-2.5 w-2.5 rounded-full bg-${dot}`} />
    {label}
  </span>
);

/* --------------------- Inventory --------------------- */
const items = [
  { name: "Mozzarella Cheese", stock: 18, total: 100, unit: "kg", low: true },
  { name: "Tomato Sauce", stock: 64, total: 100, unit: "L", low: false },
  { name: "Olive Oil (EV)", stock: 12, total: 100, unit: "L", low: true },
  { name: "Chicken Breast", stock: 78, total: 100, unit: "kg", low: false },
  { name: "Basil (Fresh)", stock: 8, total: 100, unit: "kg", low: true },
  { name: "Espresso Beans", stock: 55, total: 100, unit: "kg", low: false },
];

const InventoryDashboard = () => (
  <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-bold text-primary">Inventory · Live</h3>
        <p className="text-sm text-muted-foreground">3 items below threshold</p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
        <AlertTriangle className="h-3.5 w-3.5" /> 3 low-stock alerts
      </span>
    </div>
    <div className="space-y-4">
      {items.map((it) => {
        const pct = it.stock;
        return (
          <div
            key={it.name}
            className="rounded-xl border border-border p-4 transition hover:border-accent/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary">{it.name}</p>
                <p className="text-xs text-muted-foreground">
                  {it.stock} {it.unit} of {it.total} {it.unit}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {it.low && (
                  <span className="rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-bold text-destructive">
                    LOW
                  </span>
                )}
                <button className="inline-flex items-center gap-1 rounded-md bg-gradient-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-soft hover:opacity-95">
                  <RotateCw className="h-3 w-3" /> Reload
                </button>
              </div>
            </div>
            <Progress
              value={pct}
              className={`mt-3 h-2 ${it.low ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`}
            />
          </div>
        );
      })}
    </div>
  </div>
);

/* --------------------- Analytics --------------------- */
const chartData = [
  { day: "Mon", sales: 4200, expenses: 2100 },
  { day: "Tue", sales: 5300, expenses: 2400 },
  { day: "Wed", sales: 4800, expenses: 2200 },
  { day: "Thu", sales: 6100, expenses: 2700 },
  { day: "Fri", sales: 8400, expenses: 3300 },
  { day: "Sat", sales: 9600, expenses: 3700 },
  { day: "Sun", sales: 7900, expenses: 3100 },
];

const AnalyticsChart = () => (
  <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
    <div className="mb-5">
      <h3 className="text-lg font-bold text-primary">Weekly Performance</h3>
      <p className="text-sm text-muted-foreground">
        Sales vs. expenditures · last 7 days
      </p>
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Kpi label="Total Sales" value="$46,300" delta="+22.4%" up />
      <Kpi label="Expenses" value="$19,500" delta="-4.1%" up={false} />
      <Kpi label="Net Profit" value="$26,800" delta="+38.7%" up />
      <Kpi label="Avg Bill" value="$42.10" delta="+6.2%" up />
    </div>
    <div className="mt-6 h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="day"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />

          <RechartsLegend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="sales"
            name="Sales"
            fill="hsl(var(--accent))"
            radius={[6, 6, 0, 0]}
            barSize={28}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name="Expenses"
            stroke="hsl(var(--secondary))"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const Kpi = ({ label, value, delta, up }) => (
  <div className="rounded-xl border border-border bg-muted/40 p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-lg font-bold text-primary">{value}</p>
    <p
      className={`mt-0.5 inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-success" : "text-destructive"}`}
    >
      {up ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}{" "}
      {delta}
    </p>
  </div>
);

/* --------------------- Section --------------------- */
export const DashboardPreviews = () => (
  <section id="dashboards" className="bg-muted/40 py-20 md:py-28">
    <div className="container">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-accent">
          Live Dashboards
        </span>
        <h2 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
          See your restaurant in real time
        </h2>
        <p className="mt-4 text-muted-foreground">
          Designed by operators, for operators. Beautiful, fast, and built for
          the floor.
        </p>
      </div>

      <Tabs defaultValue="tables" className="mt-12">
        <TabsList className="mx-auto flex h-auto w-full max-w-xl flex-wrap justify-center bg-card p-1 shadow-soft">
          <TabsTrigger
            value="tables"
            className="flex-1 data-[state=active]:bg-gradient-accent data-[state=active]:text-accent-foreground"
          >
            Table Grid
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="flex-1 data-[state=active]:bg-gradient-accent data-[state=active]:text-accent-foreground"
          >
            Inventory
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex-1 data-[state=active]:bg-gradient-accent data-[state=active]:text-accent-foreground"
          >
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tables" className="mt-8">
          <TableGrid />
        </TabsContent>
        <TabsContent value="inventory" className="mt-8">
          <InventoryDashboard />
        </TabsContent>
        <TabsContent value="analytics" className="mt-8">
          <AnalyticsChart />
        </TabsContent>
      </Tabs>
    </div>
  </section>
);

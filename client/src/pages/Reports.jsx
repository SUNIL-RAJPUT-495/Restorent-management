import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import AxiosAdmin from "@/utils/axiosAdmin";
import SummaryApi from "@/common/SummerAPI";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Clock,
  Truck,
  ShoppingBag,
  DollarSign,
  Receipt,
  Wallet,
  ShoppingCart,
  CalendarIcon,
  X,
} from "lucide-react";

const PERIOD_CONFIG = {
  day: {
    label: "Today",
    multiplier: 1 / 7,
    deltas: { sales: "+8.2%", exp: "-1.4%", profit: "+12.6%", orders: "+5.1%" },
  },
  week: {
    label: "This Week",
    multiplier: 1,
    deltas: {
      sales: "+22.4%",
      exp: "-4.1%",
      profit: "+38.7%",
      orders: "+12.6%",
    },
  },
  month: {
    label: "This Month",
    multiplier: 4.3,
    deltas: {
      sales: "+31.7%",
      exp: "+6.8%",
      profit: "+44.2%",
      orders: "+18.9%",
    },
  },
};



const Reports = () => {
  const [period, setPeriod] = useState("week");
  const [customDate, setCustomDate] = useState(undefined);

  const { data: realOrders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getOrders.url);
      return response.data;
    },
  });

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const { kpi, chartData, contextLabel, filteredOrders, channelData, cancelledItems, todaySales, todayOrds } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = realOrders.filter(o => {
      if (!o.createdAt) return false;
      const d = new Date(o.createdAt);
      if (customDate) {
         const cd = new Date(customDate);
         cd.setHours(0,0,0,0);
         const dEnd = new Date(cd);
         dEnd.setDate(dEnd.getDate() + 1);
         return d >= cd && d < dEnd;
      }
      if (period === "day") {
         return d >= today;
      }
      if (period === "week") {
         const w = new Date(today);
         w.setDate(w.getDate() - 7);
         return d >= w;
      }
      if (period === "month") {
         const m = new Date(today);
         m.setMonth(m.getMonth() - 1);
         return d >= m;
      }
      return true;
    });

    const sales = filtered.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const expenses = sales * 0.35; 
    const ords = filtered.length;
    
    let chartD = [];
    if (period === 'day' || period === 'week' || customDate) {
       chartD = Array.from({ length: 7 }).map((_, i) => {
         const d = new Date();
         d.setDate(d.getDate() - (6 - i));
         d.setHours(0, 0, 0, 0);
         const dEnd = new Date(d);
         dEnd.setDate(dEnd.getDate() + 1);

         const dayOrders = realOrders.filter(o => {
           const od = new Date(o.createdAt);
           return od >= d && od < dEnd;
         });
         const daySales = dayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
         return {
           day: format(d, "EEE"),
           sales: daySales,
           expenses: daySales * 0.35,
         };
       });
    }

    const cData = [
      {
        name: "Dine-In",
        value: filtered.filter((o) => o.type === "fine-dine" || o.type === "dine-in").length || 0,
        color: "hsl(var(--primary))",
      },
      {
        name: "Takeaway",
        value: filtered.filter((o) => o.type === "qsr" || o.type === "takeaway").length || 0,
        color: "hsl(var(--accent))",
      },
      {
        name: "Delivery",
        value: filtered.filter((o) => o.type === "delivery").length || 0,
        color: "hsl(var(--secondary))",
      },
    ].filter(c => c.value > 0);
    
    if (cData.length === 0) cData.push({ name: "No Data", value: 1, color: "hsl(var(--muted))" });

    const cItems = filtered
      .filter(o => o.status === 'cancelled')
      .map(o => ({
         id: o._id,
         item: o.orderNumber,
         reason: "Order Cancelled",
         date: format(new Date(o.createdAt), "PPp"),
         loss: o.totalAmount || 0
      }));

    const tOrders = realOrders.filter(o => new Date(o.createdAt) >= today);
    const tSales = tOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    const cfg = customDate ? { label: `Showing data for ${format(customDate, "PPP")}`, deltas: {} } : PERIOD_CONFIG[period];

    return {
      kpi: {
        sales,
        expenses,
        ords,
        profit: sales - expenses,
        deltas: cfg.deltas || { sales: "-", exp: "-", profit: "-", orders: "-" },
      },
      chartData: chartD,
      contextLabel: cfg.label,
      filteredOrders: filtered,
      channelData: cData,
      cancelledItems: cItems,
      todaySales: tSales,
      todayOrds: tOrders.length
    };
  }, [period, customDate, realOrders]);

  const usingCustom = !!customDate;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-primary">
            Financial Analytics
          </h2>
          <p className="text-xs text-muted-foreground">{contextLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={period}
            onValueChange={(v) => {
              setPeriod(v);
              setCustomDate(undefined);
            }}
            disabled={usingCustom}
          >
            <SelectTrigger className="w-[150px] bg-card shadow-soft">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start bg-card shadow-soft font-normal",
                  usingCustom && "border-accent",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customDate ? (
                  format(customDate, "PPP")
                ) : (
                  <span className="text-muted-foreground">
                    Pick a custom date
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={customDate}
                onSelect={setCustomDate}
                disabled={(d) => d > new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {usingCustom && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCustomDate(undefined)}
              aria-label="Clear date"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
          <DialogTrigger asChild>
            <div className="cursor-pointer transition hover:-translate-y-1 hover:shadow-lg">
              <Kpi
                label="Total Orders"
                value={kpi.ords.toLocaleString()}
                delta={kpi.deltas.orders}
                up
                icon={<ShoppingCart className="h-4 w-4" />}
                tone="primary"
              />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-primary mb-4">Total Orders ({filteredOrders.length})</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(o => (
                  <TableRow key={o._id}>
                    <TableCell className="font-semibold text-primary">{o.orderNumber}</TableCell>
                    <TableCell>{format(new Date(o.createdAt), "PPp")}</TableCell>
                    <TableCell className="uppercase text-xs">{o.type}</TableCell>
                    <TableCell className="font-bold">₹{o.totalAmount?.toFixed(2) || 0}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                        {o.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No orders found for this period.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
        <Kpi
          label="Total Revenue"
          value={`₹${kpi.sales.toLocaleString()}`}
          delta={kpi.deltas.sales}
          up
          icon={<DollarSign className="h-4 w-4" />}
          tone="success"
        />
        <Kpi
          label="Total Expenditure"
          value={`₹${kpi.expenses.toLocaleString()}`}
          delta={kpi.deltas.exp}
          up={false}
          icon={<Receipt className="h-4 w-4" />}
          tone="destructive"
        />
        <Kpi
          label="Net Profit"
          value={`₹${kpi.profit.toLocaleString()}`}
          delta={kpi.deltas.profit}
          up
          icon={<Wallet className="h-4 w-4" />}
          tone="accent"
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-card shadow-soft">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="shifts">Shift Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-primary">
                  Sales vs. Expenditure
                </h3>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
              <Button variant="outline" size="sm">
                <FileText className="mr-1 h-3.5 w-3.5" /> Export
              </Button>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
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
                  <Legend wrapperStyle={{ fontSize: 12 }} />
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

         
        </TabsContent>

        <TabsContent value="channels" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-base font-bold text-primary">
                Order Channels
              </h3>
              <p className="text-xs text-muted-foreground">Today</p>
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={channelData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {channelData.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1.5 text-sm">
                {channelData.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-center justify-between"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: c.color }}
                      />
                      {c.name}
                    </span>
                    <span className="font-semibold text-primary">
                      {c.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="mb-3 text-base font-bold text-primary">
                Takeaway & Delivery Tracking
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders
                    .filter((o) => o.type !== "fine-dine" && o.type !== "dine-in")
                    .map((o) => (
                      <TableRow key={o._id}>
                        <TableCell className="font-semibold">
                          {o.orderNumber}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-sm">
                            {o.type === "delivery" ? (
                              <Truck className="h-3.5 w-3.5 text-secondary" />
                            ) : (
                              <ShoppingBag className="h-3.5 w-3.5 text-accent" />
                            )}
                            {o.type}
                          </span>
                        </TableCell>
                        <TableCell>{o.customer ?? "—"}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{(o.totalAmount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning capitalize">
                            {o.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredOrders.filter((o) => o.type !== "fine-dine" && o.type !== "dine-in").length === 0 && (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">No takeaway or delivery orders.</TableCell>
                     </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="mb-3 text-base font-bold text-primary">
              Cancelled Items
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancelledItems.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-primary">
                      {c.item}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.reason}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.date}
                    </TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      -₹{c.loss.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="shifts" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-primary">
                  Per-Day Report · Today
                </h3>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <Row label="Orders" value={todayOrds.toString()} />
                <Row label="Gross sales" value={`₹${todaySales.toFixed(2)}`} />
              </div>
              <Button className="mt-4 w-full bg-primary text-primary-foreground">
                Generate End-of-Day PDF
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-primary">
                  Automatic Shift Close · 22:00
                </h3>
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                  Scheduled
                </span>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                <li>• Cash drawer reconciliation</li>
                <li>• Payment gateway settlement summary</li>
                <li>• Stock auto-deduction confirmation</li>
                <li>• Shift summary emailed to manager</li>
              </ul>
              <Button variant="outline" className="mt-4 w-full">
                Configure Shift Close
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const toneMap = {
  primary: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  destructive: "text-destructive bg-destructive/10",
  accent: "text-accent bg-accent/10",
};

const Kpi = ({ label, value, delta, up, icon, tone = "primary" }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {icon && (
        <span className={`rounded-lg p-1.5 ${toneMap[tone]}`}>{icon}</span>
      )}
    </div>
    <p className="mt-2 text-2xl font-extrabold text-primary">{value}</p>
    <p
      className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-success" : "text-destructive"}`}
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
const Behavior = ({ label, value, sub }) => (
  <div className="rounded-xl border border-border bg-muted/40 p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-xl font-bold text-primary">{value}</p>
    <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
  </div>
);
const Row = ({ label, value }) => (
  <div className="flex justify-between rounded-md bg-muted px-3 py-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-primary">{value}</span>
  </div>
);

export default Reports;

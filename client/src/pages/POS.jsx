import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import AxiosAdmin from "@/utils/axiosAdmin";
import SummaryApi from "@/common/SummerAPI";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Search,
  Utensils,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TAX_RATE = 0.1;
const categories = ["All", "Starters", "Main Course", "Drinks", "Desserts"];

const POS = () => {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState([]);
  const [activeCat, setActiveCat] = useState("All");
  const [mode, setMode] = useState("qsr");
  const [payment, setPayment] = useState("card");
  const [query, setQuery] = useState("");
  const [tableNo, setTableNo] = useState("5");

  // Fetch Menu Items
  const { data: menuItems = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getProducts.url);
      return response.data;
    },
  });

  // Create Order Mutation
  const orderMutation = useMutation({
    mutationFn: async (orderData) => {
      const response = await AxiosAdmin.post(SummaryApi.createOrder.url, orderData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Order placed · ${data.orderNumber}`, {
        description: `Total: ₹${data.totalAmount.toFixed(2)}`,
      });
      setCart([]);
      queryClient.invalidateQueries(["orders"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to place order");
    },
  });

  const filtered = useMemo(
    () =>
      menuItems.filter(
        (m) =>
          (activeCat === "All" || m.category === activeCat) &&
          m.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [activeCat, query, menuItems],
  );

  const addToCart = (id) => {
    const item = menuItems.find((m) => m._id === id || m.id === id);
    if (!item) return;
    setCart((c) => {
      const ex = c.find((l) => l.id === (item._id || item.id));
      return ex
        ? c.map((l) => (l.id === (item._id || item.id) ? { ...l, qty: l.qty + 1 } : l))
        : [...c, { id: item._id || item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const updateQty = (id, delta) =>
    setCart((c) =>
      c.flatMap((l) =>
        l.id === id
          ? l.qty + delta <= 0
            ? []
            : [{ ...l, qty: l.qty + delta }]
          : [l],
      ),
    );
  const removeLine = (id) => setCart((c) => c.filter((l) => l.id !== id));

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const placeOrder = () => {
    if (!cart.length) return;
    
    const orderData = {
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty
      })),
      type: mode,
      tableNumber: mode === "fine-dine" ? tableNo : undefined,
      totalAmount: total,
      paymentMethod: payment,
    };

    orderMutation.mutate(orderData);
  };

  return (
    <div className="grid h-auto lg:h-[calc(100vh-9rem)] gap-4 grid-cols-1 lg:grid-cols-[1fr_400px]">
      {/* Menu side */}
      <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu items…"
              className="pl-9"
            />
          </div>
          <div className="inline-flex rounded-lg border border-border bg-muted p-1">
            <button
              onClick={() => setMode("qsr")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                mode === "qsr"
                  ? "bg-gradient-accent text-accent-foreground shadow-soft"
                  : "text-muted-foreground"
              }`}
            >
              <Zap className="h-3.5 w-3.5" /> QSR
            </button>
            <button
              onClick={() => setMode("fine-dine")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                mode === "fine-dine"
                  ? "bg-gradient-teal text-secondary-foreground shadow-soft"
                  : "text-muted-foreground"
              }`}
            >
              <Utensils className="h-3.5 w-3.5" /> Fine-Dine
            </button>
          </div>
        </div>

        <Tabs
          value={activeCat}
          onValueChange={(v) => setActiveCat(v)}
          className="mt-4"
        >
          <TabsList className="flex h-auto w-full flex-wrap justify-start bg-muted p-1">
            {categories.map((c) => (
              <TabsTrigger
                key={c}
                value={c}
                className="data-[state=active]:bg-card data-[state=active]:text-primary"
              >
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-4 grid flex-1 auto-rows-min gap-3 overflow-y-auto no-scrollbar pr-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <button
              key={m._id || m.id}
              onClick={() => addToCart(m._id || m.id)}
              className="group flex flex-col items-start rounded-xl border border-border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-card active:scale-[0.98]"
            >
              <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary">
                {m.category}
              </span>
              <span className="mt-3 text-sm font-semibold text-primary">
                {m.name}
              </span>
              <span className="mt-auto pt-3 text-lg font-bold text-accent">
                ₹{m.price.toFixed(2)}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              No items match your search.
            </p>
          )}
        </div>
      </div>

      {/* Order ticket */}
      <aside className="flex min-h-0 flex-col rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border bg-primary p-4 text-primary-foreground rounded-t-2xl">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-70">
              Active Order
            </p>
            <p className="text-lg font-bold">#{1048}</p>
          </div>
          {mode === "fine-dine" ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="opacity-70">Table</span>
              <Input
                value={tableNo}
                onChange={(e) => setTableNo(e.target.value)}
                className="h-8 w-14 border-white/30 bg-white/10 text-center text-sm font-bold"
              />
            </div>
          ) : (
            <span className="rounded-md bg-accent/90 px-2.5 py-1 text-xs font-bold">
              QSR · TAKEAWAY
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Receipt className="mb-3 h-10 w-10 opacity-40" />
              Tap items on the left to start an order.
            </div>
          ) : (
            <ul className="space-y-2">
              {cart.map((l) => (
                <li
                  key={l.id}
                  className="rounded-xl border border-border bg-muted/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {l.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ₹{l.price.toFixed(2)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeLine(l.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-md border border-border bg-card">
                      <button
                        onClick={() => updateQty(l.id, -1)}
                        className="px-2 py-1 hover:bg-muted"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">
                        {l.qty}
                      </span>
                      <button
                        onClick={() => updateQty(l.id, +1)}
                        className="px-2 py-1 hover:bg-muted"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      ₹{(l.price * l.qty).toFixed(2)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-border p-4">
          <div className="space-y-1 text-sm">
            <Row label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
            <Row
              label={`Tax (${(TAX_RATE * 100).toFixed(0)}%)`}
              value={`₹${tax.toFixed(2)}`}
            />
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <span className="font-bold text-primary">Total</span>
              <span className="font-extrabold text-accent">
                ₹{total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ["cash", Banknote, "Cash"],
              ["card", CreditCard, "Card"],
              ["online", Smartphone, "Online"],
            ].map(([p, Icon, label]) => (
              <button
                key={p}
                onClick={() => setPayment(p)}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-xs font-semibold transition ${
                  payment === p
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border bg-background text-muted-foreground hover:border-accent/40"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <Button
            onClick={placeOrder}
            disabled={!cart.length || orderMutation.isPending}
            className="h-12 w-full bg-gradient-accent text-base font-bold text-accent-foreground shadow-glow hover:opacity-95"
          >
            {orderMutation.isPending ? "Placing..." : `Charge ₹${total.toFixed(2)}`}
          </Button>
        </div>
      </aside>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between text-muted-foreground">
    <span>{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

export default POS;

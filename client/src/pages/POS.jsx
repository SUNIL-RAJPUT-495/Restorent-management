import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

import { Button } from "@/components/ui/button";
import AxiosAdmin from "@/utils/axiosAdmin";
import SummaryApi, { baseURL } from "@/common/SummerAPI";
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
  Users,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import BillReceipt from "@/components/BillReceipt";


const POS = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState([]);
  const [activeCat, setActiveCat] = useState("All");
  const [mode, setMode] = useState("qsr");
  const [payment, setPayment] = useState("card");
  const [query, setQuery] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [billData, setBillData] = useState(null);

  const [guests, setGuests] = useState(1);

  useEffect(() => {
    const t = searchParams.get("table");
    const g = searchParams.get("guests");
    if (t && t !== tableNo) {
      setTableNo(t);
      setMode("fine-dine");
    }
    if (g) {
      setGuests(Number(g));
    }
  }, [searchParams, tableNo]);

  // Socket Connection for Real-time POS Notifications
  useEffect(() => {
    const socket = io(baseURL);
    
    socket.on('connect', () => {
      console.log('🔗 POS Connected to WebSocket');
    });

    socket.on('newOrder', (newOrder) => {
      console.log('🆕 New Order Received via Socket:', newOrder);
      
      // Play audio notification
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
      
      toast.success(`New QR Order #${newOrder.orderNumber}!`, {
        description: `Table ${newOrder.tableNumber || 'Takeaway'}`,
        icon: <Zap className="h-4 w-4" />
      });
      
      queryClient.invalidateQueries(["orders"]);
    });

    socket.on('orderUpdated', (updatedOrder) => {
      queryClient.invalidateQueries(["orders"]);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Fetch Tables (needed for selection)
  const { data: tables = [] } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getTables.url);
      return response.data;
    },
  });

  // Fetch Orders (needed to show current items)
  const { data: ordersData = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getOrders.url);
      return response.data;
    },
  });

  // Fetch restaurant settings for taxes
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getSettings.url);
      return response.data;
    },
  });

  const orders = useMemo(() => Array.isArray(ordersData) ? ordersData : [], [ordersData]);

  const activeOrder = useMemo(() => {
    if (!tableNo || mode !== "fine-dine" || !orders.length) return null;
    const table = tables.find(t => String(t.number) === String(tableNo));
    if (!table || table.status === 'vacant' || table.status === 'free') return null;
    
    return orders.find(o =>
      o.tableNumber === String(tableNo) &&
      ['new', 'preparing', 'ready', 'delivered'].includes(o.status)
    );
  }, [tableNo, mode, orders, tables]);


  // Fetch Menu Items
  const { data: menuItems = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getProducts.url);
      return response.data;
    },
  });

  const categories = useMemo(() => {
    const list = new Set(menuItems.map((m) => m.category).filter(Boolean));
    return ["All", ...Array.from(list)];
  }, [menuItems]);

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
      
      // Set bill data to show receipt for QSR
      if (data.type === 'qsr') {
        setBillData({ activeOrder: data, tableNumber: null });
      }

      setCart([]);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["tables"]);
      
      if (mode === "fine-dine") {
        navigate("/tables");
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to place order");
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, orderData }) => {
      const api = SummaryApi.updateOrderStatus(id);
      const response = await AxiosAdmin[api.method](api.url, orderData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Order updated · ${data.orderNumber}`, {
        description: `Total: ₹${data.totalAmount.toFixed(2)}`,
      });
      setCart([]);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["tables"]);
      if (mode === "fine-dine") {
        navigate("/tables");
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update order");
    },
  });

  const filtered = useMemo(
    () =>
      menuItems.filter(
        (m) =>
          (activeCat === "All" || m.category === activeCat) &&
          m.name.toLowerCase().includes(query.toLowerCase()) &&
          m.available !== false,
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
  const cgst = +(subtotal * (settings?.cgst ?? 2.5) / 100).toFixed(2);
  const sgst = +(subtotal * (settings?.sgst ?? 2.5) / 100).toFixed(2);
  const total = +(subtotal + cgst + sgst).toFixed(2);

  const placeOrder = () => {
    if (!cart.length) return;

    if (mode === "fine-dine") {
      if (!tableNo) {
        toast.error("Please select a table first!");
        setTablePickerOpen(true);
        return;
      }
      const targetTable = tables.find(t => String(t.number) === String(tableNo));
    }

    if (activeOrder) {
      const itemsToSubmit = activeOrder.items ? activeOrder.items.map(i => ({
        productId: i.productId?._id || i.productId,
        name: i.name,
        price: i.price,
        qty: i.qty
      })) : [];

      cart.forEach(cartItem => {
        const existing = itemsToSubmit.find(i => (i.productId && i.productId === cartItem.id) || (i.name === cartItem.name));
        if (existing) {
          existing.qty += cartItem.qty;
        } else {
          itemsToSubmit.push({
            productId: cartItem.id,
            name: cartItem.name,
            price: cartItem.price,
            qty: cartItem.qty
          });
        }
      });

      updateOrderMutation.mutate({
        id: activeOrder._id,
        orderData: {
          items: itemsToSubmit,
          totalAmount: activeOrder.totalAmount + total,
          status: 'new'
        }
      });
    } else {
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty
        })),
        type: mode,
        tableNumber: mode === "fine-dine" ? tableNo : undefined,
        guests: mode === "fine-dine" ? guests : undefined,
        totalAmount: total,
        paymentMethod: payment,
      };

      orderMutation.mutate(orderData);
    }
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
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === "qsr"
                  ? "bg-gradient-accent text-accent-foreground shadow-soft"
                  : "text-muted-foreground"
                }`}
            >
              <Zap className="h-3.5 w-3.5" /> QSR
            </button>
            <button
              onClick={() => setMode("fine-dine")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === "fine-dine"
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
              className="group flex flex-col items-center rounded-xl border border-border bg-background p-3 text-center transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-card active:scale-[0.98]"
            >
              <div className="w-full h-32 mb-3 rounded-lg overflow-hidden flex-shrink-0 bg-muted/40 flex items-center justify-center">
                {m.image ? (
                  <img src={m.image} alt={m.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <Utensils className="h-10 w-10 text-muted-foreground/30" />
                )}
              </div>
              <span className="text-sm font-bold text-primary w-full truncate px-1">
                {m.name}
              </span>
              <span className="mt-1 text-base font-extrabold text-accent">
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
            <div className="flex items-center gap-2">
              {tableNo && (
                <div className="flex items-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-2 text-white h-9 transition-all">
                  <Users className="h-4 w-4 opacity-80" />
                  <Input
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-10 bg-transparent p-0 text-center text-sm font-bold border-0 focus-visible:ring-0 h-full placeholder:text-white/50"
                  />
                </div>
              )}
              <Dialog open={tablePickerOpen} onOpenChange={setTablePickerOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-9 gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
                    <Utensils className="h-4 w-4" />
                    {tableNo ? `Table ${tableNo}` : "Table Select"}
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Select Table</DialogTitle>
                  <DialogDescription>
                    Choose a table to assign this order to.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-3 py-4 sm:grid-cols-4">
                  {tables.length > 0 && tables.every(t => t.status === 'occupied') && (
                    <div className="col-span-full mb-2 rounded-lg bg-destructive/10 p-3 text-center text-sm font-bold text-destructive animate-pulse">
                      ⚠️ All tables are full! Please wait some time.
                    </div>
                  )}
                  {Array.isArray(tables) && tables.map((t) => {
                    const activeOrder = Array.isArray(orders) ? orders.find(o =>
                      o.tableNumber === String(t.number) &&
                      ['new', 'preparing', 'ready', 'delivered'].includes(o.status) &&
                      t.status !== 'vacant' && t.status !== 'free'
                    ) : null;
                    const isSelected = tableNo === String(t.number);

                    return (
                      <button
                        key={t._id}
                        onClick={() => {
                          if (t.status === 'occupied') {
                            toast.error(`Table ${t.number} is occupied! All tables are full? Please wait.`);
                            return;
                          }
                          setTableNo(String(t.number));
                          setTablePickerOpen(false);
                          setSearchParams({ table: String(t.number) });
                        }}
                        className={`relative rounded-xl border-2 p-3 text-left transition ${
                          t.status === 'occupied' 
                            ? "border-destructive/20 bg-destructive/5 cursor-not-allowed" 
                            : isSelected 
                              ? "border-accent bg-accent/5 ring-2 ring-accent/20" 
                              : "border-border hover:border-accent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">T-{t.number}</span>
                          {t.status === 'occupied' && (
                            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                          )}
                        </div>
                        <div className="mt-2 flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                            <Users className="h-3 w-3" /> {t.guests || 0} / {t.capacity || 0}
                          </div>
                          {activeOrder && (
                            <div className="text-[10px] font-bold text-accent truncate">
                              ₹{(activeOrder.totalAmount || 0).toFixed(0)} active
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
            </div>
          ) : (
            <span className="rounded-md bg-accent/90 px-2.5 py-1 text-xs font-bold">
              QSR · TAKEAWAY
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4">
          {activeOrder && (
            <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-accent flex items-center gap-1">
                  <Receipt className="h-3 w-3" /> Current Bill
                </p>
                <span className="text-[10px] font-bold text-muted-foreground">Order #{activeOrder.orderNumber?.slice(-4)}</span>
              </div>
              <ul className="space-y-1 max-h-48 overflow-y-auto no-scrollbar pr-1">
                {activeOrder.items?.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-[11px] text-foreground/70">
                    <span>{item.qty} × {item.name}</span>
                    <span>₹{((item.price || 0) * (item.qty || 0)).toFixed(0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>CGST ({settings?.cgst ?? 2.5}%)</span>
              <span>₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>SGST ({settings?.sgst ?? 2.5}%)</span>
              <span>₹{sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 text-xl font-black text-primary">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          {mode !== "fine-dine" && (
            <div className="grid grid-cols-3 gap-2">
              {[
                ["cash", Banknote, "Cash"],
                ["card", CreditCard, "Card"],
                ["online", Smartphone, "Online"],
              ].map(([p, Icon, label]) => (
                <button
                  key={p}
                  onClick={() => setPayment(p)}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-xs font-semibold transition ${payment === p
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border bg-background text-muted-foreground hover:border-accent/40"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          )}

          <Button
            onClick={placeOrder}
            disabled={!cart.length || orderMutation.isPending || updateOrderMutation.isPending || (mode === "fine-dine" && !tableNo)}
            className="h-12 w-full bg-gradient-accent text-base font-bold text-accent-foreground shadow-glow hover:opacity-95 disabled:opacity-50"
          >
            {orderMutation.isPending || updateOrderMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Receipt className="mr-2 h-5 w-5" />
                {mode === "fine-dine" 
                  ? (activeOrder ? "Update Kitchen Order" : "Send to Kitchen") 
                  : `Pay ₹${total.toFixed(2)}`}
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Bill/Receipt Dialog */}
      <Dialog open={!!billData} onOpenChange={(o) => !o && setBillData(null)}>
        <DialogContent className="max-w-sm flex flex-col max-h-[90vh] p-0 overflow-hidden bg-white border-slate-100 print:shadow-none print:border-none">
          <DialogHeader className="hidden">
            <DialogTitle className="sr-only">Receipt</DialogTitle>
            <DialogDescription className="sr-only">Final bill for your order.</DialogDescription>
          </DialogHeader>
          {billData && (
            <BillReceipt 
                billData={billData} 
                settings={settings} 
                onClose={() => setBillData(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
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

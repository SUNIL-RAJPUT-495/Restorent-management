import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import AxiosAdmin from "@/utils/axiosAdmin";
import SummaryApi from "@/common/SummerAPI";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users, Clock, CalendarClock, Receipt, Utensils } from "lucide-react";

import { toast } from "sonner";

const STATUS_META = {
  free: {
    label: "Available",
    ring: "border-success/50",
    bg: "bg-success/5",
    text: "text-success",
    dot: "bg-success",
  },
  occupied: {
    label: "Occupied",
    ring: "border-destructive/50",
    bg: "bg-destructive/5",
    text: "text-destructive",
    dot: "bg-destructive",
  },
  reserved: {
    label: "Reserved",
    ring: "border-warning/60",
    bg: "bg-warning/5",
    text: "text-warning",
    dot: "bg-warning",
  },
};

const minutesAgo = (iso) => {
  if (!iso) return 0;
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 60_000),
  );
};

const Tables = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newSeats, setNewSeats] = useState("4");
  const [billData, setBillData] = useState(null);

  const adminInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem("rw_admin_info") || "{}");
    } catch {
      return {};
    }
  })();
  const restaurantName = adminInfo.name || "RestoOS";


  // Fetch Tables
  const { data: tables = [] } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getTables.url);
      return response.data;
    },
  });

  // Fetch Orders
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getOrders.url);
      return response.data;
    },
  });

  // Table status mutation
  const tableMutation = useMutation({
    mutationFn: async ({ number, status, guests }) => {
      const api = SummaryApi.updateTable(number);
      const response = await AxiosAdmin[api.method](api.url, { 
        status, 
        guests,
        occupiedSince: status === 'occupied' ? new Date() : null
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tables"]);
      setSelected(null);
    },
  });

  const addTableMutation = useMutation({
    mutationFn: async (data) => {
      const response = await AxiosAdmin.post(SummaryApi.addTable.url, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tables"]);
      setAddOpen(false);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const api = SummaryApi.updateOrderStatus(id);
      const response = await AxiosAdmin[api.method](api.url, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["orders"]);
    },
  });

  const counts = useMemo(
    () =>
      tables.reduce(
        (acc, t) => ({ ...acc, [t.status || 'free']: (acc[t.status || 'free'] || 0) + 1 }),
        { free: 0, occupied: 0, reserved: 0 },
      ),
    [tables],
  );

  const setStatus = (number, status, guests) => {
    tableMutation.mutate({ number, status, guests });
  };

  const seatGuests = (number) => {
    setStatus(number, "occupied", 1);
    navigate(`/?table=${number}`);
  };

  const generateBill = (activeOrder, tableNumber) => {
    if (activeOrder && activeOrder._id) {
      setBillData({ activeOrder, tableNumber });
      setSelected(null);
    } else {
      toast.info(`No active order to bill for Table ${tableNumber}. Table cleared.`);
      setStatus(tableNumber, "vacant");
      setSelected(null);
    }
  };

  const finalizeBill = () => {
    if (billData) {
      updateOrderMutation.mutate({ id: billData.activeOrder._id, status: 'completed' });
      setStatus(billData.tableNumber, "vacant");
      toast.success(`Bill finalized for Table ${billData.tableNumber}. Total: ₹${billData.activeOrder.totalAmount?.toFixed(2) || 0}`);
      setBillData(null);
    }
  };


  const reserve = (number) => {
    setStatus(number, "reserved");
    toast.success(`Table reserved`);
  };

  const free = (number) => {
    setStatus(number, "vacant");
    toast.success("Table cleared");
  };

  const addTable = () => {
    const seats = parseInt(newSeats) || 4;
    const nextNumber = tables.length > 0 ? Math.max(...tables.map((t) => parseInt(t.number))) + 1 : 1;
    addTableMutation.mutate({ number: String(nextNumber), capacity: seats, status: "vacant" });
  };

  return (
    <div className="space-y-5">
      {/* Summary + actions */}
      <div className="flex flex-wrap items-center gap-3">
        {["free", "occupied", "reserved"].map((s) => (
          <div
            key={s}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-soft"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${STATUS_META[s].dot}`}
            />
            <span className="text-sm font-medium capitalize text-muted-foreground">
              {STATUS_META[s].label}
            </span>
            <span className="text-lg font-extrabold text-primary">
              {counts[s]}
            </span>
          </div>
        ))}
        <div className="ml-auto">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-accent text-accent-foreground shadow-soft hover:opacity-95">
                <Plus className="mr-1 h-4 w-4" /> Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Quick Add Table</DialogTitle>
                <DialogDescription className="sr-only">
                  Add a new table to your floor plan.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <Label>Seats</Label>
                <Input
                  type="number"
                  min={1}
                  value={newSeats}
                  onChange={(e) => setNewSeats(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={addTable}
                  className="bg-primary text-primary-foreground"
                >
                  Add Table
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Floor plan */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          Main Hall · Floor Plan
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {tables.map((t) => {
            const statusKey = t.status === 'vacant' ? 'free' : t.status;
            const meta = STATUS_META[statusKey];
            return (
              <button
                key={t._id}
                onClick={() => setSelected(t)}
                className={`group relative rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-card ${meta.ring} ${meta.bg}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Table
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${meta.dot} ${t.status === "occupied" ? "animate-pulse-soft" : ""}`}
                  />
                </div>
                <p className="mt-1 text-3xl font-extrabold text-primary">
                  {String(t.number).padStart(2, "0")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t.seats} seats
                </p>
                <div className={`mt-2 text-[11px] font-semibold ${meta.text}`}>
                  {meta.label}
                </div>
                {t.status === "occupied" && (
                  <div className="mt-1 flex items-center justify-between text-[11px] text-foreground/70">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {t.guests}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {minutesAgo(t.occupiedSince)}m
                    </span>
                  </div>
                )}
                {t.status === "reserved" && (
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-warning">
                    <CalendarClock className="h-3 w-3" /> {t.reservedFor}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (() => {
            const activeOrder = orders.find(o => 
              o.tableNumber === String(selected.number) && 
              ['new', 'preparing', 'ready', 'delivered'].includes(o.status) &&
              selected.status !== 'vacant' && selected.status !== 'free'
            );
            return (
              <>
                <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Table {String(selected.number).padStart(2, "0")}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_META[selected.status === 'vacant' ? 'free' : selected.status].bg} ${STATUS_META[selected.status === 'vacant' ? 'free' : selected.status].text}`}
                  >
                    {STATUS_META[selected.status === 'vacant' ? 'free' : selected.status].label}
                  </span>
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Manage table status and guests.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2 text-sm">
                <Row label="Capacity" value={`${selected.seats || selected.capacity} seats`} />
                {(selected.guests > 0) && (
                  <Row label="Guests" value={String(selected.guests)} />
                )}
                {selected.occupiedSince && (
                  <Row
                    label="Occupied for"
                    value={`${minutesAgo(selected.occupiedSince)} min`}
                  />
                )}
                {selected.reservedFor && (
                  <Row label="Reserved for" value={selected.reservedFor} />
                )}
                
                {activeOrder ? (
                  <div className="mt-4 space-y-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-accent">Active Order: {activeOrder.orderNumber}</p>
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                        {activeOrder.status}
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs max-h-48 overflow-y-auto no-scrollbar pr-1">
                      {activeOrder.items?.map((item, idx) => (
                        <li key={idx} className="flex justify-between text-foreground/80">
                          <span>{item.qty} × {item.name}</span>
                          <span>₹{(item.price * item.qty).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between border-t border-accent/10 pt-2 font-bold text-primary">
                      <span>Total</span>
                      <span>₹{activeOrder.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                ) : selected.status === 'occupied' && (
                  <p className="mt-4 rounded-lg bg-muted p-4 text-center text-xs text-muted-foreground">
                    No active order found for this table.
                  </p>
                )}
              </div>
              <DialogFooter className="flex-wrap gap-2 sm:justify-start">
                {selected.status === "occupied" && (
                  <Button 
                    className="bg-accent text-accent-foreground shadow-glow" 
                    onClick={() => navigate(`/?table=${selected.number}`)}
                  >
                    <Utensils className="mr-1 h-4 w-4" /> Order More
                  </Button>
                )}
                {(selected.status !== "occupied" && selected.status !== "Reserved") && (
                  <Button
                    onClick={() => seatGuests(selected.number)}
                    className="bg-gradient-accent text-accent-foreground shadow-glow"
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Menu
                  </Button>
                )}
                {selected.status === "occupied" && (
                  <Button
                    className="bg-gradient-teal text-secondary-foreground shadow-glow"
                    onClick={() => generateBill(activeOrder, selected.number)}
                  >
                    <Receipt className="mr-1 h-4 w-4" /> Generate Bill
                  </Button>
                )}
                {selected.status === "occupied" && (
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => free(selected.number)}>
                    Clear Table
                  </Button>
                )}
                {(selected.status === "vacant" || selected.status === "free") && (
                  <Button
                    variant="outline"
                    onClick={() => reserve(selected.number)}
                  >
                    <CalendarClock className="mr-1 h-4 w-4" /> Reserve
                  </Button>
                )}
              </DialogFooter>

            </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Bill Dialog */}
      <Dialog open={!!billData} onOpenChange={(o) => !o && setBillData(null)}>
        <DialogContent className="max-w-sm">
          {billData && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Receipt</span>
                  <span className="text-muted-foreground text-sm">Table {String(billData.tableNumber).padStart(2, '0')}</span>
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Final bill for the table.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="mb-4 text-center">
                  <h3 className="text-xl font-bold text-primary uppercase">{restaurantName}</h3>
                  <p className="text-xs text-muted-foreground">Order #{billData.activeOrder.orderNumber?.slice(-4)}</p>
                </div>
                <div className="space-y-2 border-y border-dashed border-border py-4 text-sm max-h-[40vh] overflow-y-auto no-scrollbar">
                  {billData.activeOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.qty} x {item.name}</span>
                      <span>₹{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between text-lg font-bold text-primary">
                  <span>Total Amount</span>
                  <span>₹{billData.activeOrder.totalAmount?.toFixed(2) || 0}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBillData(null)}>
                  Cancel
                </Button>
                <Button className="bg-success text-success-foreground" onClick={finalizeBill}>
                  Complete Payment
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between rounded-md bg-muted px-3 py-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-primary">{value}</span>
  </div>
);

export default Tables;

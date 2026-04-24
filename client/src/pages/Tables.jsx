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
import { Plus, Users, Clock, CalendarClock, Receipt, Utensils, Trash2, Edit } from "lucide-react";

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
  const [selectedId, setSelectedId] = useState(null);
  const [guestCount, setGuestCount] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [newSeats, setNewSeats] = useState("4");
  const [billData, setBillData] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ number: "", capacity: "" });

  const adminInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem("rw_admin_info") || "{}");
    } catch {
      return {};
    }
  })();
  const restaurantName = adminInfo.name || "RestoOS";


  // Fetch restaurant settings for bill
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getSettings.url);
      return response.data;
    },
  });

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

  // Derive selected from live tables data so it stays fresh
  const selected = tables.find((t) => t._id === selectedId) || null;

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
      setSelectedId(null);
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

  const deleteTableMutation = useMutation({
    mutationFn: async (number) => {
      const api = SummaryApi.deleteTable(number);
      const response = await AxiosAdmin[api.method](api.url);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tables"]);
      setSelectedId(null);
      toast.success("Table deleted");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete table")
  });

  const updateTableMutation = useMutation({
    mutationFn: async ({ oldNumber, data }) => {
      const api = SummaryApi.updateTable(oldNumber);
      const response = await AxiosAdmin[api.method](api.url, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tables"]);
      setIsEditing(false);
      toast.success("Table updated");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update table")
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

  const seatGuests = (number, count) => {
    setStatus(number, "occupied", parseInt(count) || 1);
    navigate(`/?table=${number}&guests=${parseInt(count) || 1}`);
  };

  const generateBill = (activeOrder, tableNumber) => {
    if (activeOrder && activeOrder._id) {
      setBillData({ activeOrder, tableNumber });
      setSelectedId(null);
    } else {
      toast.info(`No active order to bill for Table ${tableNumber}. Table cleared.`);
      setStatus(tableNumber, "vacant");
      setSelectedId(null);
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

  const free = (number, activeOrderId) => {
    if (activeOrderId) {
      updateOrderMutation.mutate({ id: activeOrderId, status: 'cancelled' });
    }
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
                onClick={() => setSelectedId(t._id)}
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
      <Dialog open={!!selected} onOpenChange={(o) => {
        if (!o) {
          setSelectedId(null);
          setIsEditing(false);
        }
        setGuestCount(1);
      }}>
        <DialogContent className="max-w-md flex flex-col max-h-[85vh]">
          {selected && (() => {
            const activeOrder = (selected.status !== 'vacant' && selected.status !== 'free') ? orders.find(o => 
              String(o.tableNumber) === String(selected.number) && 
              ['new', 'preparing', 'ready', 'delivered'].includes(o.status)
            ) : null;
            return (
              <>
                <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    Table {String(selected.number).padStart(2, "0")}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_META[selected.status === 'vacant' ? 'free' : selected.status].bg} ${STATUS_META[selected.status === 'vacant' ? 'free' : selected.status].text}`}
                    >
                      {STATUS_META[selected.status === 'vacant' ? 'free' : selected.status].label}
                    </span>
                  </DialogTitle>
                  {(selected.status === 'vacant' || selected.status === 'free') && !isEditing && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => {
                        setEditData({ number: selected.number, capacity: selected.capacity || selected.seats });
                        setIsEditing(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                        if (window.confirm("Are you sure you want to delete this table?")) {
                          deleteTableMutation.mutate(selected.number);
                        }
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <DialogDescription className="sr-only">
                  Manage table status and guests.
                </DialogDescription>
              </DialogHeader>

              {isEditing ? (
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Table Number</Label>
                    <Input value={editData.number} onChange={e => setEditData({ ...editData, number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity (Seats)</Label>
                    <Input type="number" value={editData.capacity} onChange={e => setEditData({ ...editData, capacity: e.target.value })} />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button 
                      className="bg-primary text-primary-foreground" 
                      onClick={() => updateTableMutation.mutate({ oldNumber: selected.number, data: { number: editData.number, capacity: editData.capacity } })}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
              <div className="flex-1 overflow-y-auto no-scrollbar -mx-1 px-1">
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
                </div>

                {activeOrder ? (
                  <div className="mt-3 space-y-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-accent">Order: #{activeOrder.orderNumber?.slice(-6)}</p>
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                        {activeOrder.status}
                      </span>
                    </div>
                    {/* Scrollable order items */}
                    <div className="w-full rounded-lg border border-accent/10">
                      <div className="max-h-48 overflow-y-auto no-scrollbar">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-accent/10 text-accent">
                              <th className="px-3 py-2 text-left font-semibold">#</th>
                              <th className="px-3 py-2 text-left font-semibold">Item</th>
                              <th className="px-3 py-2 text-center font-semibold">Qty</th>
                              <th className="px-3 py-2 text-right font-semibold">Price</th>
                              <th className="px-3 py-2 text-right font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-accent/10">
                            {activeOrder.items?.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                <td className="px-3 py-2 font-medium text-foreground">{item.name}</td>
                                <td className="px-3 py-2 text-center text-foreground/80">{item.qty}</td>
                                <td className="px-3 py-2 text-right text-foreground/70">₹{Number(item.price).toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-semibold text-primary">₹{(item.price * item.qty).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="flex justify-between border-t border-accent/10 pt-2 font-bold text-primary">
                      <span>Total</span>
                      <span>₹{(activeOrder.totalAmount ?? activeOrder.items?.reduce((s,i) => s + i.price*i.qty, 0) ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                ) : selected.status === 'occupied' ? (
                  <p className="mt-4 rounded-lg bg-muted p-4 text-center text-xs text-muted-foreground">
                    No active order found for this table.
                  </p>
                ) : null}
              </div>
              )}
              
              {!isEditing && (
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
                  <div className="flex items-center w-full gap-2 sm:w-auto">
                    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="number" 
                        min="1" 
                        max={selected.capacity || 10} 
                        value={guestCount} 
                        onChange={e => setGuestCount(e.target.value)} 
                        className="w-12 h-9 border-0 bg-transparent text-center focus-visible:ring-0 p-0" 
                      />
                    </div>
                    <Button
                      onClick={() => seatGuests(selected.number, guestCount)}
                      className="bg-gradient-accent text-accent-foreground shadow-glow"
                    >
                      <Plus className="mr-1 h-4 w-4" /> Add Menu
                    </Button>
                  </div>
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
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => free(selected.number, activeOrder?._id)}>
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
              )}

            </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Bill Dialog */}
      <Dialog open={!!billData} onOpenChange={(o) => !o && setBillData(null)}>
        <DialogContent className="max-w-sm flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="sr-only">Receipt</DialogTitle>
            <DialogDescription className="sr-only">Final bill for the table.</DialogDescription>
          </DialogHeader>
          {billData && (() => {
            const items = billData.activeOrder.items || [];
            const subtotal = items.reduce((s, i) => s + (i.price * i.qty), 0);
            const cgstRate = (settings?.cgst ?? 2.5) / 100;
            const sgstRate = (settings?.sgst ?? 2.5) / 100;
            const cgst = subtotal * cgstRate;
            const sgst = subtotal * sgstRate;
            const grandTotal = subtotal + cgst + sgst;
            const totalQty = items.reduce((s, i) => s + i.qty, 0);
            return (
              <>
                {/* Receipt Body — scrollable */}
                <div className="overflow-y-auto no-scrollbar flex-1 font-mono text-xs">
                  {/* Header */}
                  <div className="text-center py-3 border-b border-dashed border-border">
                    <p className="text-base font-bold uppercase tracking-widest text-primary">{settings?.restaurantName || "Restaurant"}</p>
                    {settings?.gstNo && <p className="mt-0.5 text-muted-foreground">GSTIN: {settings.gstNo}</p>}
                    {settings?.fssaiNo && <p className="text-muted-foreground">FSSAI: {settings.fssaiNo}</p>}
                    {settings?.location && <p className="text-muted-foreground">{settings.location}</p>}
                    {settings?.phone && <p className="text-muted-foreground">Mob: {settings.phone}</p>}
                  </div>

                  {/* Bill Meta */}
                  <div className="py-2 border-b border-dashed border-border space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bill No:</span>
                      <span>#{billData.activeOrder.orderNumber?.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Table:</span>
                      <span>{String(billData.tableNumber).padStart(2, '0')}</span>
                    </div>
                    {(billData.guests || billData.activeOrder.guests) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Guests:</span>
                        <span>{billData.guests || billData.activeOrder.guests}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{new Date().toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="py-2 border-b border-dashed border-border">
                    <div className="flex justify-between font-bold border-b border-border pb-1 mb-1">
                      <span className="w-5">#</span>
                      <span className="flex-1">Item</span>
                      <span className="w-8 text-center">Qty</span>
                      <span className="w-16 text-right">Amt</span>
                    </div>
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span className="w-5 text-muted-foreground">{idx + 1}</span>
                        <span className="flex-1 truncate pr-1">{item.name}</span>
                        <span className="w-8 text-center">{item.qty}</span>
                        <span className="w-16 text-right">₹{(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="py-2 border-b border-dashed border-border space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Qty</span>
                      <span>{totalQty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CGST ({settings?.cgst ?? 2.5}%)</span>
                      <span>₹{cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SGST ({settings?.sgst ?? 2.5}%)</span>
                      <span>₹{sgst.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="py-3 text-center">
                    <div className="flex justify-between text-sm font-bold text-primary border-t-2 border-primary pt-2">
                      <span>GRAND TOTAL</span>
                      <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                    <p className="mt-3 text-[10px] text-muted-foreground">Good food, good times. Thanks for choosing us!</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <DialogFooter className="pt-3 border-t border-border flex gap-2">
                  <Button variant="outline" onClick={() => setBillData(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button className="bg-success text-success-foreground flex-1" onClick={finalizeBill}>
                    Complete Payment
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
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

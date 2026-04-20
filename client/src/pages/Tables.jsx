import { useMemo, useState } from "react";
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
import { Plus, Users, Clock, CalendarClock, Receipt } from "lucide-react";
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
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newSeats, setNewSeats] = useState("4");

  // Fetch Tables
  const { data: tables = [] } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getTables.url);
      return response.data;
    },
  });

  // Table status mutation
  const tableMutation = useMutation({
    mutationFn: async ({ number, status }) => {
      const api = SummaryApi.updateTable(number);
      const response = await AxiosAdmin[api.method](api.url, { status });
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

  const counts = useMemo(
    () =>
      tables.reduce(
        (acc, t) => ({ ...acc, [t.status || 'free']: (acc[t.status || 'free'] || 0) + 1 }),
        { free: 0, occupied: 0, reserved: 0 },
      ),
    [tables],
  );

  const setStatus = (number, status) => {
    tableMutation.mutate({ number, status });
  };

  const seatGuests = (number) => {
    setStatus(number, "occupied");
    toast.success(`Table seated`);
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
        <DialogContent>
          {selected && (
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
                <Row label="Capacity" value={`${selected.seats} seats`} />
                {selected.guests && (
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
                {selected.orderId && (
                  <Row label="Order" value={selected.orderId.toUpperCase()} />
                )}
              </div>
              <DialogFooter className="flex-wrap gap-2 sm:justify-start">
                {selected.status !== "occupied" && (
                  <Button
                    onClick={() =>
                      seatGuests(selected.number)
                    }
                    className="bg-gradient-accent text-accent-foreground"
                  >
                    <Users className="mr-1 h-4 w-4" /> Seat & Open Order
                  </Button>
                )}
                {selected.status === "occupied" && (
                  <Button className="bg-primary text-primary-foreground">
                    <Receipt className="mr-1 h-4 w-4" /> View Order
                  </Button>
                )}
                {selected.status === "vacant" && (
                  <Button
                    variant="outline"
                    onClick={() => reserve(selected.number)}
                  >
                    <CalendarClock className="mr-1 h-4 w-4" /> Reserve
                  </Button>
                )}
                {selected.status !== "vacant" && (
                  <Button variant="outline" onClick={() => free(selected.number)}>
                    Mark Free
                  </Button>
                )}
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

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { baseURL } from "../common/SummerAPI";
import AxiosAdmin from "@/utils/axiosAdmin";
import SummaryApi from "@/common/SummerAPI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChefHat,
  Clock,
  ArrowRight,
  Tag,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Starters", "Main Course", "Drinks", "Desserts"];
const emptyDraft = () => ({
  name: "",
  category: "Main Course",
  price: "",
  cost: "",
  available: true,
  promotion: false,
  image: "",
  recipe: [],
});

const STATUS_FLOW = ["new", "preparing", "ready", "delivered"];
const STATUS_STYLE = {
  new: "border-secondary/40 bg-secondary-soft",
  preparing: "border-warning/50 bg-warning/10",
  ready: "border-success/50 bg-success/10",
  delivered: "border-border bg-muted/40",
  cancelled: "border-destructive/50 bg-destructive/10",
};

const MenuKDS = () => {
  const queryClient = useQueryClient();

  // Socket Connection for Real-time KDS
  useEffect(() => {
    const socket = io(baseURL);
    
    socket.on('connect', () => {
      console.log('🔗 KDS Connected to WebSocket');
    });

    socket.on('newOrder', (newOrder) => {
      console.log('🆕 New Order Received via Socket:', newOrder);
      
      // Play audio notification
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
      
      queryClient.invalidateQueries(["orders"]);
      toast.success(`New Order #${newOrder.orderNumber}!`, {
        description: `Table ${newOrder.tableNumber || 'Takeaway'}`,
        icon: <ChefHat className="h-4 w-4" />
      });
    });

    socket.on('orderUpdated', (updatedOrder) => {
      queryClient.invalidateQueries(["orders"]);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Fetch Menu Items
  const { data: items = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getProducts.url);
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
    refetchInterval: 10000, // Polling for new orders
  });

  // Mutate Order Status
  const advanceMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const api = SummaryApi.updateOrderStatus(id);
      const response = await AxiosAdmin[api.method](api.url, { status });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Order ${data.orderNumber} status updated`);
      queryClient.invalidateQueries(["orders"]);
    },
  });

  // Mutate Product
  const productMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      let payload = { ...data };
      if (payload.image instanceof File) {
        payload.image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(payload.image);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      }
      const api = id ? SummaryApi.updateProduct(id) : SummaryApi.addProduct;
      const response = await AxiosAdmin[id ? api.method : "post"](api.url, payload);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["products"]);
      setDialogOpen(false);
      toast.success(variables.id ? "Menu item updated" : "Menu item added");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || "Failed to save item");
    },
  });

  const updatePrice = (id, price) => {
    productMutation.mutate({ id, data: { price } });
  };
  
  const toggleAvail = (id, available) => {
    productMutation.mutate({ id, data: { available } });
    toast(available ? "Item enabled" : "Item disabled");
  };

  const togglePromotion = (id, promotion) => {
    productMutation.mutate({ id, data: { promotion } });
    toast(promotion ? "Promotion enabled" : "Promotion disabled");
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setDialogOpen(true);
  };
  const openEdit = (m) => {
    setEditingId(m._id || m.id);
    const { _id, id, createdAt, updatedAt, __v, ...rest } = m;
    setDraft({
      ...rest,
      promotion: rest.promotion ?? false,
    });
    setDialogOpen(true);
  };
  const saveDraft = () => {
    if (!draft.name.trim()) {
      toast.error("Name is required");
      return;
    }
    productMutation.mutate({ 
      id: editingId, 
      data: {
        ...draft,
        promotion: !!draft.promotion,
        price: Number(draft.price) || 0,
        cost: Number(draft.cost) || 0
      }
    });
  };
  const deleteItem = async (id) => {
    const api = SummaryApi.deleteProduct(id);
    await AxiosAdmin.delete(api.url);
    queryClient.invalidateQueries(["products"]);
    toast("Menu item deleted");
  };

  const advance = (id, currentStatus) => {
    if (currentStatus === "delivered" || currentStatus === "cancelled") return;
    const next = STATUS_FLOW[Math.min(STATUS_FLOW.indexOf(currentStatus) + 1, STATUS_FLOW.length - 1)];
    advanceMutation.mutate({ id, status: next });
  };

  const grouped = {
    new: [],
    preparing: [],
    ready: [],
    delivered: [],
    cancelled: [],
  };
  orders.forEach((o) => {
    if (grouped[o.status]) {
      grouped[o.status].push(o);
    }
  });

  return (
    <Tabs defaultValue="menu">
      <TabsList className="bg-card shadow-soft">
        <TabsTrigger value="menu">Menu Editor</TabsTrigger>
        <TabsTrigger value="kds">Kitchen Display</TabsTrigger>
      </TabsList>

      <TabsContent value="menu" className="mt-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-primary">Menu Items</h2>
              <p className="text-xs text-muted-foreground">
                {items.length} items · edit prices, availability, or manage
                entries
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={openCreate}
                  className="bg-primary text-primary-foreground hover:bg-primary-glow"
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit menu item" : "Add menu item"}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Fill in the details to save your menu item.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="m-name">Name</Label>
                    <Input
                      id="m-name"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      placeholder="e.g. Margherita Pizza"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Category</Label>
                    <Select
                      value={draft.category}
                      onValueChange={(v) => setDraft({ ...draft, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="m-price">Price (₹)</Label>
                      <Input
                        id="m-price"
                        type="number"
                        step="0.5"
                        value={draft.price}
                        onChange={(e) =>
                          setDraft({ ...draft, price: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="m-cost">Cost (₹)</Label>
                      <Input
                        id="m-cost"
                        type="number"
                        step="0.1"
                        value={draft.cost}
                        onChange={(e) =>
                          setDraft({ ...draft, cost: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="m-image">Image</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="m-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setDraft({ ...draft, image: e.target.files[0] });
                          }
                        }}
                      />
                      {draft.image && (
                        <img 
                          src={draft.image instanceof File ? URL.createObjectURL(draft.image) : draft.image} 
                          alt="Preview" 
                          className="h-10 w-10 object-cover rounded-md border"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <Label htmlFor="m-avail" className="cursor-pointer">
                      Available
                    </Label>
                    <Switch
                      id="m-avail"
                      checked={draft.available}
                      onCheckedChange={(v) =>
                        setDraft({ ...draft, available: v })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <Label htmlFor="m-promo" className="cursor-pointer">
                      Make as promotion
                    </Label>
                    <Switch
                      id="m-promo"
                      checked={draft.promotion}
                      onCheckedChange={(v) =>
                        setDraft({ ...draft, promotion: v })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveDraft}
                    className="bg-primary text-primary-foreground hover:bg-primary-glow"
                  >
                    {editingId ? "Save changes" : "Add item"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Image</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Promotion</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell>
                      {m.image ? (
                        <img src={m.image} alt={m.name} className="h-10 w-10 object-cover rounded-md border" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <ChefHat className="h-5 w-5 text-muted-foreground opacity-50" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {m.name}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {m.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.5"
                        value={m.price}
                        onChange={(e) => updatePrice(m._id, +e.target.value)}
                        className="h-8 w-24"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      ₹{m.cost.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={m.promotion}
                          onCheckedChange={(value) => togglePromotion(m._id, value)}
                        />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                          {m.promotion ? 'Promo' : 'No'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={m.available}
                        onCheckedChange={(v) => toggleAvail(m._id, v)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(m)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteItem(m._id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="kds" className="mt-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {["new", "preparing", "ready", "delivered"].map((status) => (
            <section
              key={status}
              className="rounded-2xl border border-border bg-card p-3 shadow-soft"
            >
              <header className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                  {status}
                </h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                  {grouped[status].length}
                </span>
              </header>
              <div className="space-y-2">
                {grouped[status].length === 0 && (
                  <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                    No tickets
                  </p>
                )}
                {grouped[status].map((o) => (
                  <article
                    key={o._id}
                    className={`rounded-xl border-2 p-3 ${STATUS_STYLE[o.status]}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-primary">
                          {o.orderNumber}
                        </p>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          {o.type}
                          {o.tableNumber
                            ? ` · Table ${o.tableNumber}`
                            : o.customer
                              ? ` · ${o.customer}`
                              : ""}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {Math.max(
                          0,
                          Math.floor(
                            (Date.now() - new Date(o.createdAt).getTime()) /
                              60_000,
                          ),
                        )}
                        m
                      </span>
                    </div>
                    <ul className="mt-2 space-y-0.5 text-xs text-foreground/80">
                      {o.items?.map((l, i) => (
                        <li key={i} className="flex justify-between">
                          <span>
                            {l.qty}× {l.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {status !== "delivered" && (
                      <Button
                        size="sm"
                        onClick={() => advance(o._id, o.status)}
                        className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary-glow"
                      >
                        <ChefHat className="mr-1 h-3.5 w-3.5" /> Advance{" "}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </TabsContent>

      
    </Tabs>
  );
};

export default MenuKDS;

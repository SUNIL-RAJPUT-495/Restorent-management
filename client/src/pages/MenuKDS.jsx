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
  Image,
  Megaphone,
  Search,
} from "lucide-react";
import { toast } from "sonner";

const compressImageFile = (file, maxDimension = 1000, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      URL.revokeObjectURL(img.src);
      resolve(compressedBase64);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(img.src);
      reject(err);
    };
  });
};

const base64ToBlob = (base64, mimeType = 'image/jpeg') => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
};

const emptyDraft = () => ({
  name: "",
  category: "Main Course",
  price: "",
  originalPrice: "",
  cost: "",
  available: true,
  trackStock: false,
  stock: "",
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

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getCategories.url);
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
        try {
          const compressedBase64 = await compressImageFile(payload.image, 1000, 0.75);
          payload.image = compressedBase64;
        } catch (error) {
          console.error("Image compression failed, falling back to raw base64 upload:", error);
          payload.image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(payload.image);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
          });
        }
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());

  // Category State & Mutation
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  const addCategoryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await AxiosAdmin.post(SummaryApi.addCategory.url, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["categories"]);
      setDraft((d) => ({ ...d, category: data.name }));
      setAddCategoryOpen(false);
      setNewCatName("");
      setNewCatDesc("");
      toast.success(`Category "${data.name}" added successfully!`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add category");
    }
  });

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      toast.error("Category name is required");
      return;
    }
    addCategoryMutation.mutate({ name: newCatName.trim(), description: newCatDesc.trim() });
  };

  const openCreate = () => {
    setEditingId(null);
    setDraft({
      ...emptyDraft(),
      category: categories[0]?.name || "Main Course"
    });
    setDialogOpen(true);
  };
  const openEdit = (m) => {
    setEditingId(m._id || m.id);
    const { _id, id, createdAt, updatedAt, __v, ...rest } = m;
    setDraft({
      ...rest,
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
        price: Number(draft.price) || 0,
        originalPrice: Number(draft.originalPrice) || 0,
        cost: Number(draft.cost) || 0,
        stock: Number(draft.stock) || 0
      }
    });
  };
  const deleteItem = async (id) => {
    const api = SummaryApi.deleteProduct(id);
    await AxiosAdmin.delete(api.url);
    queryClient.invalidateQueries(["products"]);
    toast("Menu item deleted");
  };

  // Fetch Promo Banners
  const { data: promotions = [] } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getPromotions.url);
      return response.data;
    },
  });

  // Mutate Promo Banner
  const promotionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      let payload = { ...data };

      if (payload.image instanceof File) {
        try {
          // Promo banners are in 21:9 ratio, 1200px maxDimension is perfect for crisp quality on all screens
          const compressedBase64 = await compressImageFile(payload.image, 1200, 0.75);
          payload.image = compressedBase64;
        } catch (error) {
          console.error("Promo image compression failed, falling back to raw base64 upload:", error);
          payload.image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(payload.image);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
          });
        }
      }

      const api = id ? SummaryApi.updatePromotion(id) : SummaryApi.addPromotion;
      const response = await AxiosAdmin[id ? api.method : "post"](api.url, payload);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["promotions"]);
      setPromoDialogOpen(false);
      toast.success(variables.id ? "Promotion banner updated" : "Promotion banner added");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || "Failed to save promotion");
    },
  });

  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState("");
  const [promoDraft, setPromoDraft] = useState({
    image: "",
    productId: "",
    title: "",
    description: "",
    active: true,
  });

  const openCreatePromo = () => {
    setEditingPromoId(null);
    setPromoDraft({
      image: "",
      productId: "",
      title: "",
      description: "",
      active: true,
    });
    setPromoDialogOpen(true);
  };

  const openEditPromo = (p) => {
    setEditingPromoId(p._id || p.id);
    setPromoDraft({
      image: p.image || "",
      productId: p.productId?._id || p.productId || "",
      title: p.title || "",
      description: p.description || "",
      active: p.active ?? true,
    });
    setPromoDialogOpen(true);
  };

  const savePromoDraft = () => {
    if (!promoDraft.image) {
      toast.error("Banner image is required");
      return;
    }
    promotionMutation.mutate({
      id: editingPromoId,
      data: {
        ...promoDraft,
        productId: promoDraft.productId === "none" ? "" : promoDraft.productId,
      }
    });
  };

  const deletePromo = async (id) => {
    const api = SummaryApi.deletePromotion(id);
    await AxiosAdmin.delete(api.url);
    queryClient.invalidateQueries(["promotions"]);
    toast("Promotion banner deleted");
  };

  const togglePromoActive = (id, active) => {
    promotionMutation.mutate({ id, data: { active } });
    toast(active ? "Promotion enabled" : "Promotion disabled");
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
    <>
      <Tabs defaultValue="menu">
        <TabsList className="bg-card shadow-soft">
          <TabsTrigger value="menu">Menu Editor</TabsTrigger>
          <TabsTrigger value="kds">Kitchen Display</TabsTrigger>
          <TabsTrigger value="parmotion">Promotion</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft md:p-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl p-4 md:p-6">
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
                      <div className="flex gap-2">
                        <select
                          id="m-category"
                          value={draft.category}
                          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                          className="flex-grow h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-semibold text-slate-800 cursor-pointer"
                        >
                          {categories.map((c) => (
                            <option key={c._id || c.name} value={c.name} className="font-semibold text-slate-800 bg-white">
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAddCategoryOpen(true)}
                          className="h-10 px-3 bg-muted/50 border border-border"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        <Label htmlFor="m-originalPrice">Original Price (₹)</Label>
                        <Input
                          id="m-originalPrice"
                          type="number"
                          step="0.5"
                          placeholder="Compare Price"
                          value={draft.originalPrice}
                          onChange={(e) =>
                            setDraft({ ...draft, originalPrice: e.target.value })
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
                    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 mt-2">
                      <Label htmlFor="m-trackStock" className="cursor-pointer font-medium text-slate-700">
                        Track Product Stock Directly
                      </Label>
                      <Switch
                        id="m-trackStock"
                        checked={draft.trackStock}
                        onCheckedChange={(v) =>
                          setDraft({ ...draft, trackStock: v })
                        }
                      />
                    </div>
                    {draft.trackStock && (
                      <div className="grid gap-1.5 mt-2 animate-in slide-in-from-top-1 duration-200">
                        <Label htmlFor="m-stock">Current Stock Level</Label>
                        <Input
                          id="m-stock"
                          type="number"
                          value={draft.stock}
                          onChange={(e) =>
                            setDraft({ ...draft, stock: e.target.value })
                          }
                          placeholder="e.g. 50"
                        />
                      </div>
                    )}
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
                      disabled={productMutation.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary-glow min-w-[100px] flex items-center justify-center gap-1.5"
                    >
                      {productMutation.isPending ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                          Saving...
                        </>
                      ) : (
                        editingId ? "Save changes" : "Add item"
                      )}
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
                        <div>
                          <p>{m.name}</p>
                          {m.trackStock && (
                            <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${m.stock <= 5 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                              Stock: {m.stock} left
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {m.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Input
                            type="number"
                            step="0.5"
                            value={m.price}
                            onChange={(e) => updatePrice(m._id, +e.target.value)}
                            className="h-8 w-24"
                          />
                          {m.originalPrice > m.price && (
                            <span className="text-[10px] text-muted-foreground line-through font-semibold pl-1">
                              ₹{m.originalPrice}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        ₹{m.cost.toFixed(2)}
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
        <TabsContent value="parmotion" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft md:p-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-primary">Promotion Banners</h2>
                <p className="text-xs text-muted-foreground">
                  {promotions.length} banners · manage Swiggy-style homepage promotional banners
                </p>
              </div>
              <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={openCreatePromo}
                    className="bg-primary text-primary-foreground hover:bg-primary-glow"
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Banner
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[475px] w-[95vw] max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl p-4 md:p-6">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPromoId ? "Edit promotion banner" : "Add promotion banner"}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      Fill in the details to save your promotional banner.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="p-image">Banner Image (Aspect Ratio 21:9 recommended)</Label>
                      <div className="flex flex-col gap-3">
                        <Input
                          id="p-image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPromoDraft({ ...promoDraft, image: e.target.files[0] });
                            }
                          }}
                        />
                        {promoDraft.image && (
                          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border bg-muted">
                            <img
                              src={promoDraft.image instanceof File ? URL.createObjectURL(promoDraft.image) : promoDraft.image}
                              alt="Banner Preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="p-title">Banner Title / Offer</Label>
                      <Input
                        id="p-title"
                        value={promoDraft.title}
                        onChange={(e) =>
                          setPromoDraft({ ...promoDraft, title: e.target.value })
                        }
                        placeholder="e.g. FLAT 50% OFF"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="p-desc">Subtitle / Description</Label>
                      <Input
                        id="p-desc"
                        value={promoDraft.description}
                        onChange={(e) =>
                          setPromoDraft({ ...promoDraft, description: e.target.value })
                        }
                        placeholder="e.g. On all main course dishes today"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label className="text-xs font-bold text-slate-700">Link to Product (Clicking banner adds this item)</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectorOpen(true)}
                          className="flex-grow flex items-center justify-between px-3 py-2 text-xs border-border/80 hover:bg-muted font-semibold h-10"
                        >
                          {promoDraft.productId ? (
                            <span className="text-primary flex items-center gap-1.5">
                              <Tag className="h-3.5 w-3.5 text-accent animate-pulse" />
                              {items.find(p => (p._id || p.id) === promoDraft.productId)?.name || "Linked Product"}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                (₹{items.find(p => (p._id || p.id) === promoDraft.productId)?.price})
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic font-normal">No Product Linked (Display only)</span>
                          )}
                          <span className="text-[10px] bg-primary-soft text-primary font-bold px-2 py-0.5 rounded">
                            Choose
                          </span>
                        </Button>
                        {promoDraft.productId && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setPromoDraft({ ...promoDraft, productId: "" })}
                            className="h-10 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border border-border/40 px-3"
                          >
                            Unlink
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 mt-1">
                      <Label htmlFor="p-active" className="cursor-pointer">
                        Active Status
                      </Label>
                      <Switch
                        id="p-active"
                        checked={promoDraft.active}
                        onCheckedChange={(v) =>
                          setPromoDraft({ ...promoDraft, active: v })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setPromoDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={savePromoDraft}
                      disabled={promotionMutation.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary-glow min-w-[100px] flex items-center justify-center gap-1.5"
                    >
                      {promotionMutation.isPending ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                          Saving...
                        </>
                      ) : (
                        editingPromoId ? "Save changes" : "Add banner"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="overflow-x-auto">
              {promotions.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl py-12 px-4 text-center">
                  <Megaphone className="h-10 w-10 text-muted-foreground/45 mb-3 animate-pulse" />
                  <h3 className="text-sm font-bold text-primary mb-1">No Promotion Banners Yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mb-4">
                    Add beautiful banners linked to your best dishes to grab your customer&apos;s attention instantly!
                  </p>
                  <Button
                    size="sm"
                    onClick={openCreatePromo}
                    className="bg-primary text-primary-foreground hover:bg-primary-glow"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add First Banner
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Version */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-40">Banner</TableHead>
                          <TableHead>Offer Title</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Linked Product</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {promotions.map((p) => (
                          <TableRow key={p._id}>
                            <TableCell>
                              <div className="relative aspect-[21/9] w-28 overflow-hidden rounded border bg-muted shadow-sm">
                                <img
                                  src={p.image}
                                  alt={p.title || "Banner"}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-primary">
                              {p.title || <span className="text-xs italic text-muted-foreground/60">No Title</span>}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                              {p.description || <span className="italic text-muted-foreground/40">No Description</span>}
                            </TableCell>
                            <TableCell>
                              {p.productId ? (
                                <div className="flex flex-col">
                                  <span className="font-semibold text-xs text-slate-800">
                                    {p.productId.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    ₹{p.productId.price} · {p.productId.category}
                                  </span>
                                </div>
                              ) : (
                                <span className="rounded-full bg-slate-100 text-slate-400 font-semibold px-2 py-0.5 text-[10px] border border-slate-200">
                                  Unlinked
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={p.active}
                                  onCheckedChange={(value) => togglePromoActive(p._id, value)}
                                />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  {p.active ? 'Active' : 'Off'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditPromo(p)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deletePromo(p._id)}
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

                  {/* Mobile Card Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden mt-2">
                    {promotions.map((p) => (
                      <div key={p._id} className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                        {/* Banner Image */}
                        <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted border-b border-border">
                          <img
                            src={p.image}
                            alt={p.title || "Banner"}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                            <span className={`h-1.5 w-1.5 rounded-full ${p.active ? 'bg-green-500' : 'bg-rose-500 animate-pulse'}`}></span>
                            {p.active ? 'Active' : 'Off'}
                          </div>
                        </div>

                        {/* Banner Info */}
                        <div className="p-4 flex flex-col flex-grow justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-sm text-primary leading-tight">
                              {p.title || <span className="text-xs italic text-muted-foreground/60">No Title</span>}
                            </h4>
                            {p.description && (
                              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                                {p.description}
                              </p>
                            )}
                          </div>

                          {/* Linked Product Info */}
                          <div className="rounded-lg bg-muted/50 p-2.5 border border-border/40 text-xs">
                            <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider mb-0.5">Linked Item</span>
                            {p.productId ? (
                              <div className="flex justify-between items-center gap-2">
                                <span className="font-semibold text-primary truncate">
                                  {p.productId.name}
                                </span>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100 whitespace-nowrap">
                                  ₹{p.productId.price}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50 italic text-[11px]">No product linked (display only)</span>
                            )}
                          </div>

                          {/* Controls and Actions */}
                          <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-1">
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`p-active-mobile-${p._id}`}
                                checked={p.active}
                                onCheckedChange={(value) => togglePromoActive(p._id, value)}
                              />
                              <Label htmlFor={`p-active-mobile-${p._id}`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer select-none">
                                {p.active ? 'Active' : 'Off'}
                              </Label>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditPromo(p)}
                                className="h-9 px-3 flex items-center gap-1 text-xs border-border/80 hover:bg-muted"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => deletePromo(p._id)}
                                className="h-9 px-3 flex items-center gap-1 text-xs bg-destructive/10 text-destructive hover:bg-destructive/25 border border-destructive/20"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>


      </Tabs>
      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogContent className="sm:max-w-[450px] w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-4 rounded-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-bold">Select Product to Link</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Search or browse categories to select a product.
            </DialogDescription>
          </DialogHeader>

          <div className="relative w-full mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input
              placeholder="Search products by name..."
              value={selectorSearch}
              onChange={(e) => setSelectorSearch(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>

          <div className="flex-grow overflow-y-auto pr-1 space-y-4 max-h-[50vh]">
            {categories.map(categoryObj => {
              const category = categoryObj.name;
              const filteredSelectorItems = items.filter(item =>
                item.category === category &&
                item.name.toLowerCase().includes(selectorSearch.toLowerCase())
              );
              if (filteredSelectorItems.length === 0) return null;
              return (
                <div key={category} className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100/50">
                    {category} ({filteredSelectorItems.length})
                  </h4>
                  <div className="grid gap-1.5">
                    {filteredSelectorItems.map((prod) => {
                      const isSelected = promoDraft.productId === (prod._id || prod.id);
                      return (
                        <button
                          key={prod._id || prod.id}
                          type="button"
                          onClick={() => {
                            setPromoDraft({ ...promoDraft, productId: prod._id || prod.id });
                            setSelectorOpen(false);
                            setSelectorSearch("");
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${isSelected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border/60 hover:bg-muted/40 hover:border-border'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="h-9 w-9 object-cover rounded-lg border shadow-sm shrink-0" />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center border shrink-0">
                                <ChefHat className="h-4.5 w-4.5 text-muted-foreground/50" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className={`text-xs font-bold block truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {prod.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
                                ₹{prod.price}
                                {prod.originalPrice > prod.price && (
                                  <span className="line-through text-[9px] text-slate-300 font-normal">₹{prod.originalPrice}</span>
                                )}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${isSelected
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-muted text-muted-foreground'
                            }`}>
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {items.filter(item => item.name.toLowerCase().includes(selectorSearch.toLowerCase())).length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground italic">
                No products found matching &quot;{selectorSearch}&quot;
              </div>
            )}
          </div>
          <DialogFooter className="mt-3 pt-2 border-t border-border shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectorOpen(false);
                setSelectorSearch("");
              }}
              className="w-full text-xs h-9"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Category Dialog */}
      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent className="sm:max-w-[400px] w-[95vw] rounded-2xl p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for your menu items.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="c-name">Category Name</Label>
              <Input
                id="c-name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Cigarettes, Cold Drinks, Chocolates"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-desc">Description (Optional)</Label>
              <Input
                id="c-desc"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="e.g. Cigarettes and smoking filters"
              />
            </div>
          </div>
          <DialogFooter className="mt-3">
            <Button
              variant="outline"
              onClick={() => setAddCategoryOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={addCategoryMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary-glow min-w-[100px] flex items-center justify-center gap-1.5"
            >
              {addCategoryMutation.isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                  Adding...
                </>
              ) : (
                "Add Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MenuKDS;

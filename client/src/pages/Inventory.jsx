import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AxiosAdmin from "@/utils/axiosAdmin";
import SummaryApi from "@/common/SummerAPI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  RotateCw,
  Search,
  Plus,
  Trash2,
  Edit2,
  MinusCircle,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Inventory = () => {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [ingDialogOpen, setIngDialogOpen] = useState(false);
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [editingIng, setEditingIng] = useState(null);
  const [editingRecipeProduct, setEditingRecipeProduct] = useState(null);

  // Recipe Links State
  const [recipeDraft, setRecipeDraft] = useState([]); // [{ ingredientId, quantity }]
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [ingredientQty, setIngredientQty] = useState("1");
  const [recipeQuery, setRecipeQuery] = useState("");

  // Direct Stock Products State
  const [directQuery, setDirectQuery] = useState("");
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustStockVal, setAdjustStockVal] = useState("");
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  
  const [ingDraft, setIngDraft] = useState({
    name: "", unit: "kg", stock: "", threshold: "", costPerUnit: "", supplier: ""
  });

  // Add Direct Product State
  const [addDirectOpen, setAddDirectOpen] = useState(false);
  const [directDraft, setDirectDraft] = useState({
    name: "",
    category: "",
    price: "",
    cost: "",
    stock: "",
    available: true,
    trackStock: true
  });

  // Fetch Ingredients
  const { data: ingredients = [] } = useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getIngredients.url);
      return response.data;
    },
  });

  // Fetch Products
  const { data: products = [] } = useQuery({
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

  // Ingredient Mutations
  const ingMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      const api = id ? SummaryApi.updateIngredient(id) : SummaryApi.addIngredient;
      const response = await AxiosAdmin[id ? 'put' : 'post'](api.url, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["ingredients"]);
      setIngDialogOpen(false);
    }
  });

  const deleteIngMutation = useMutation({
    mutationFn: async (id) => {
      const api = SummaryApi.deleteIngredient(id);
      await AxiosAdmin.delete(api.url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["ingredients"]);
      toast.success("Ingredient removed");
    }
  });

  // Product/Recipe Mutation
  const recipeMutation = useMutation({
    mutationFn: async ({ id, recipe }) => {
      const api = SummaryApi.updateProduct(id);
      await AxiosAdmin.put(api.url, { recipe });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      setRecipeDialogOpen(false);
      toast.success("Recipe updated");
    }
  });

  // Direct Stock Adjustment Mutation
  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, stock }) => {
      const api = SummaryApi.updateProduct(id);
      await AxiosAdmin.put(api.url, { stock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      setAdjustDialogOpen(false);
      toast.success("Stock level updated");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to adjust stock");
    }
  });

  // Direct Product Creation Mutation
  const addDirectMutation = useMutation({
    mutationFn: async (data) => {
      const response = await AxiosAdmin.post(SummaryApi.addProduct.url, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      setAddDirectOpen(false);
      toast.success("Direct stock item added successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add direct stock item");
    }
  });

  const filtered = useMemo(
    () =>
      ingredients.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())),
    [ingredients, query],
  );

  const lowCount = ingredients.filter((i) => i.stock <= i.threshold).length;
  const totalValue = ingredients.reduce((s, i) => s + i.stock * i.costPerUnit, 0);

  const saveIngredient = () => {
    if (!ingDraft.name.trim()) return toast.error("Name is required");
    const payload = {
      ...ingDraft,
      stock: Number(ingDraft.stock) || 0,
      threshold: Number(ingDraft.threshold) || 0,
      costPerUnit: Number(ingDraft.costPerUnit) || 0
    };
    ingMutation.mutate({ id: editingIng?._id, data: payload });
    toast.success(editingIng ? "Updated" : "Added");
  };

  const openAddIng = () => {
    setEditingIng(null);
    setIngDraft({ name: "", unit: "kg", stock: "", threshold: "", costPerUnit: "", supplier: "" });
    setIngDialogOpen(true);
  };

  const openEditIng = (i) => {
    setEditingIng(i);
    setIngDraft({ ...i });
    setIngDialogOpen(true);
  };
  
  const openEditRecipe = (p) => {
    setEditingRecipeProduct(p);
    setRecipeDraft(
      p.recipe
        ? p.recipe.filter(Boolean).map((r) => ({
            ingredientId: r.ingredientId?._id || r.ingredientId,
            quantity: r.quantity,
          }))
        : []
    );
    setSelectedIngredientId("");
    setIngredientQty("1");
    setRecipeDialogOpen(true);
  };

  const addIngredientToRecipe = () => {
    if (!selectedIngredientId) return toast.error("Select an ingredient");
    if (recipeDraft.some((item) => item.ingredientId === selectedIngredientId)) {
      return toast.error("Ingredient is already linked");
    }
    setRecipeDraft([
      ...recipeDraft,
      { ingredientId: selectedIngredientId, quantity: Number(ingredientQty) || 1 },
    ]);
    setSelectedIngredientId("");
    setIngredientQty("1");
  };

  const removeIngredientFromRecipe = (id) => {
    setRecipeDraft(recipeDraft.filter((item) => item.ingredientId !== id));
  };

  const saveRecipe = () => {
    recipeMutation.mutate({
      id: editingRecipeProduct?._id || editingRecipeProduct?.id,
      recipe: recipeDraft,
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Items tracked" value={String(ingredients.length)} />
        <Stat
          label="Low-stock alerts"
          value={String(lowCount)}
          accent={lowCount > 0 ? "destructive" : "success"}
        />
        <Stat label="Inventory value" value={`₹${totalValue.toFixed(0)}`} />
      </div>

      <Tabs defaultValue="stock">
        <TabsList className="bg-card shadow-soft">
          <TabsTrigger value="stock">Stock (Raw/Ings)</TabsTrigger>
          <TabsTrigger value="recipes">Recipe Linking</TabsTrigger>
          <TabsTrigger value="direct">Direct Stock Products</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft md:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ingredients…"
                  className="pl-9"
                />
              </div>
              <Dialog open={ingDialogOpen} onOpenChange={setIngDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddIng} className="bg-primary text-primary-foreground">
                    <Plus className="mr-1 h-4 w-4" /> New Ingredient
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingIng ? "Edit Ingredient" : "Add New Ingredient"}</DialogTitle>
                    <DialogDescription>
                      {editingIng ? "Update ingredient details and stock levels." : "Enter details for the new inventory item."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-1.5">
                      <Label>Name</Label>
                      <Input value={ingDraft.name} onChange={e => setIngDraft({...ingDraft, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label>Stock</Label>
                        <Input type="number" value={ingDraft.stock} onChange={e => setIngDraft({...ingDraft, stock: e.target.value})} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Threshold</Label>
                        <Input type="number" value={ingDraft.threshold} onChange={e => setIngDraft({...ingDraft, threshold: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label>Unit</Label>
                        <Input value={ingDraft.unit} onChange={e => setIngDraft({...ingDraft, unit: e.target.value})} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Cost per Unit</Label>
                        <Input type="number" value={ingDraft.costPerUnit} onChange={e => setIngDraft({...ingDraft, costPerUnit: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Supplier</Label>
                      <Input value={ingDraft.supplier} onChange={e => setIngDraft({...ingDraft, supplier: e.target.value})} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={saveIngredient}>Save Ingredient</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Supplier
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((i) => {
                    const pct = Math.min(
                      100,
                      Math.round((i.stock / (i.threshold * 4)) * 100) || 0,
                    );
                    const low = i.stock <= i.threshold;
                    return (
                      <TableRow key={i._id} className="align-middle">
                        <TableCell>
                          <p className="font-semibold text-primary">{i.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {i.stock} {i.unit} on hand · threshold {i.threshold}{" "}
                            {i.unit}
                          </p>
                        </TableCell>
                        <TableCell className="w-[260px]">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={pct}
                              className={`h-2 flex-1 ${low ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`}
                            />
                            {low && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                                <AlertTriangle className="h-3 w-3" /> LOW
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {i.supplier}
                        </TableCell>
                        <TableCell className="hidden text-sm md:table-cell">
                          ₹{i.costPerUnit.toFixed(2)}/{i.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditIng(i)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteIngMutation.mutate(i._id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recipes" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft md:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={recipeQuery}
                  onChange={(e) => setRecipeQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock Link / Recipe</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter((p) => p.name.toLowerCase().includes(recipeQuery.toLowerCase()))
                    .map((p) => (
                      <TableRow key={p._id || p.id} className="align-middle">
                        <TableCell>
                          <p className="font-semibold text-primary">{p.name}</p>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground font-semibold">
                            {p.category}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-slate-700">₹{p.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {!p.recipe || p.recipe.length === 0 ? (
                              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                                Direct Sale (No Tracking)
                              </span>
                            ) : (
                              p.recipe.map((r) => {
                                const ing = ingredients.find(
                                  (i) => i._id === (r.ingredientId?._id || r.ingredientId)
                                );
                                return (
                                  <span
                                    key={r.ingredientId?._id || r.ingredientId}
                                    className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2.5 py-0.5 text-[11px] font-bold text-success"
                                  >
                                    {ing ? `${ing.name} (1× ${r.quantity} ${ing.unit})` : `Linked Item (${r.quantity})`}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditRecipe(p)}
                            className="h-8 gap-1.5 px-3 border-primary/20 hover:border-primary/45 font-bold text-primary hover:bg-primary/5 active:scale-[0.98] transition-all"
                          >
                            <FlaskConical className="h-3.5 w-3.5 animate-pulse" /> Link Stock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="direct" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft md:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={directQuery}
                  onChange={(e) => setDirectQuery(e.target.value)}
                  placeholder="Search direct stock items..."
                  className="pl-9"
                />
              </div>
              <Button
                onClick={() => {
                  setDirectDraft({
                    name: "",
                    category: categories[0]?.name || "Drinks",
                    price: "",
                    cost: "",
                    stock: "",
                    available: true,
                    trackStock: true
                  });
                  setAddDirectOpen(true);
                }}
                className="bg-primary text-primary-foreground font-bold flex items-center gap-1.5 h-10 px-4 active:scale-[0.98] transition-all hover:bg-primary-glow"
              >
                <Plus className="h-4 w-4" /> New Direct Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Current Stock Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter((p) => p.trackStock && p.name.toLowerCase().includes(directQuery.toLowerCase()))
                    .map((p) => {
                      const low = p.stock <= 5;
                      return (
                        <TableRow key={p._id || p.id} className="align-middle">
                          <TableCell>
                            <p className="font-semibold text-primary">{p.name}</p>
                          </TableCell>
                          <TableCell>
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground font-semibold">
                              {p.category}
                            </span>
                          </TableCell>
                          <TableCell className="font-bold text-slate-700">₹{p.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-black shadow-sm ${low ? "bg-destructive/10 text-destructive border border-destructive/20 animate-pulse" : "bg-success/10 text-success border border-success/20"}`}>
                                {p.stock} units left
                              </span>
                              {low && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                                  <AlertTriangle className="h-3 w-3" /> LOW STOCK
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAdjustProduct(p);
                                setAdjustStockVal(String(p.stock));
                                setAdjustDialogOpen(true);
                              }}
                              className="h-8 gap-1.5 px-3 border-primary/20 hover:border-primary/45 font-bold text-primary hover:bg-primary/5 active:scale-[0.98] transition-all"
                            >
                              <Plus className="h-3.5 w-3.5" /> Adjust Stock / Restock
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {products.filter((p) => p.trackStock).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground italic bg-muted/5 rounded-xl">
                        No direct stock tracking products found. You can enable direct stock tracking for products in the Menu Editor!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recipe / Stock Link Mapping Dialog */}
      <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
        <DialogContent className="sm:max-w-[450px] w-[95vw] rounded-2xl p-4 md:p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle>Stock Link: {editingRecipeProduct?.name}</DialogTitle>
            <DialogDescription>
              Map this product to inventory items. When this product is ordered, the stock of these linked items decreases.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Existing Links */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Linked Inventory Items
              </Label>
              {recipeDraft.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground italic bg-muted/20">
                  Not linked to any inventory. Ordered items won't decrease stock.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                  {recipeDraft.map((item) => {
                    const ing = ingredients.find((i) => i._id === item.ingredientId);
                    return (
                      <div
                        key={item.ingredientId}
                        className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-soft animate-in fade-in"
                      >
                        <div>
                          <span className="font-semibold text-primary">
                            {ing ? ing.name : "Inventory Item"}
                          </span>
                          <span className="ml-1.5 text-xs text-muted-foreground font-bold bg-muted px-1.5 py-0.5 rounded-sm">
                            {item.quantity} {ing ? ing.unit : ""}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeIngredientFromRecipe(item.ingredientId)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <hr className="border-border" />

            {/* Add Link Section */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Link New Inventory Stock Item
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px] gap-2 items-end">
                <div className="grid gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-bold">Select Inventory Item</Label>
                  <select
                    value={selectedIngredientId}
                    onChange={(e) => setSelectedIngredientId(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value="" disabled>-- Select Item --</option>
                    {ingredients.map((ing) => (
                      <option key={ing._id} value={ing._id} className="font-semibold text-slate-800 bg-white">
                        {ing.name} ({ing.stock} {ing.unit} available)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[11px] text-muted-foreground font-bold">Qty Consumed</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={ingredientQty}
                    onChange={(e) => setIngredientQty(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={addIngredientToRecipe}
                className="w-full flex items-center justify-center gap-1 px-3 text-xs h-9 border border-border/80 hover:bg-muted font-bold"
              >
                <Plus className="h-3.5 w-3.5" /> Add to Stock Link
              </Button>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRecipeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveRecipe}
              disabled={recipeMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary-glow min-w-[100px] flex items-center justify-center gap-1.5"
            >
              {recipeMutation.isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                "Save Link"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Direct Stock Level Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-[400px] w-[95vw] rounded-2xl p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Adjust Stock: {adjustProduct?.name}</DialogTitle>
            <DialogDescription>
              Update the physical inventory count for this direct-sale product.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="grid gap-1.5">
              <Label htmlFor="adj-stock">Current Stock Count</Label>
              <Input
                id="adj-stock"
                type="number"
                value={adjustStockVal}
                onChange={(e) => setAdjustStockVal(e.target.value)}
                placeholder="e.g. 100"
              />
            </div>
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                adjustStockMutation.mutate({
                  id: adjustProduct?._id || adjustProduct?.id,
                  stock: Number(adjustStockVal) || 0
                });
              }}
              disabled={adjustStockMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary-glow min-w-[100px] flex items-center justify-center gap-1.5"
            >
              {adjustStockMutation.isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                "Save Stock Level"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Direct Item Dialog */}
      <Dialog open={addDirectOpen} onOpenChange={setAddDirectOpen}>
        <DialogContent className="sm:max-w-[400px] w-[95vw] rounded-2xl p-4 md:p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle>Add Direct Stock Item</DialogTitle>
            <DialogDescription>
              Add a new direct-sale product (like cold drinks, cigarettes, chips) with instant stock tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="d-name">Item Name</Label>
              <Input
                id="d-name"
                value={directDraft.name}
                onChange={(e) => setDirectDraft({ ...directDraft, name: e.target.value })}
                placeholder="e.g. Coca-Cola 300ml, Lays Blue, Marlboro Lights"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="d-category">Category</Label>
              <select
                id="d-category"
                value={directDraft.category}
                onChange={(e) => setDirectDraft({ ...directDraft, category: e.target.value })}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold text-slate-800 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c._id || c.name} value={c.name} className="font-semibold text-slate-800 bg-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="d-price">Sell Price (₹)</Label>
                <Input
                  id="d-price"
                  type="number"
                  value={directDraft.price}
                  onChange={(e) => setDirectDraft({ ...directDraft, price: e.target.value })}
                  placeholder="e.g. 40"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="d-cost">Cost Price (₹)</Label>
                <Input
                  id="d-cost"
                  type="number"
                  value={directDraft.cost}
                  onChange={(e) => setDirectDraft({ ...directDraft, cost: e.target.value })}
                  placeholder="e.g. 30"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="d-stock">Initial Stock Level</Label>
              <Input
                id="d-stock"
                type="number"
                value={directDraft.stock}
                onChange={(e) => setDirectDraft({ ...directDraft, stock: e.target.value })}
                placeholder="e.g. 100"
              />
            </div>
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setAddDirectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!directDraft.name.trim()) return toast.error("Item name is required");
                if (!directDraft.price) return toast.error("Sell price is required");
                
                addDirectMutation.mutate({
                  ...directDraft,
                  price: Number(directDraft.price) || 0,
                  cost: Number(directDraft.cost) || 0,
                  stock: Number(directDraft.stock) || 0
                });
              }}
              disabled={addDirectMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary-glow min-w-[100px] flex items-center justify-center gap-1.5"
            >
              {addDirectMutation.isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                  Adding...
                </>
              ) : (
                "Add Direct Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Stat = ({ label, value, accent }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
    <p
      className={`mt-1 text-2xl font-extrabold ${accent === "destructive" ? "text-destructive" : accent === "success" ? "text-success" : "text-primary"}`}
    >
      {value}
    </p>
  </div>
);

export default Inventory;

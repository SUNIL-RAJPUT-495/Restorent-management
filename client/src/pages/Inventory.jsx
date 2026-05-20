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
  
  const [ingDraft, setIngDraft] = useState({
    name: "", unit: "kg", stock: "", threshold: "", costPerUnit: "", supplier: ""
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
    setRecipeDialogOpen(true);
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
          <TabsTrigger value="stock">Stock</TabsTrigger>
         
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

       
      </Tabs>
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

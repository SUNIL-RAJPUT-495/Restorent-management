import { useMemo, useState } from "react";
import { ingredients as seed, menuItems } from "@/data/mockData";
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
  AlertTriangle,
  RotateCw,
  Search,
  ShoppingBag,
  MinusCircle,
} from "lucide-react";
import { toast } from "sonner";

const Inventory = () => {
  const [items, setItems] = useState(seed);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );
  const lowCount = items.filter((i) => i.stock <= i.threshold).length;
  const totalValue = items.reduce((s, i) => s + i.stock * i.costPerUnit, 0);

  const reload = (id) => {
    setItems((arr) =>
      arr.map((i) => (i.id === id ? { ...i, stock: i.threshold * 4 } : i)),
    );
    toast.success("Stock reloaded");
  };
  const simulateDeduction = (id) => {
    setItems((arr) =>
      arr.map((i) =>
        i.id === id
          ? {
              ...i,
              stock: Math.max(0, +(i.stock - i.threshold * 0.1).toFixed(2)),
            }
          : i,
      ),
    );
    toast("Auto-deduction simulated", {
      description: "Sale recorded — ingredient deducted.",
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Items tracked" value={String(items.length)} />
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
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
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
              <Button variant="outline">
                <ShoppingBag className="mr-1 h-4 w-4" /> New Purchase Order
              </Button>
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
                      Math.round((i.stock / (i.threshold * 4)) * 100),
                    );
                    const low = i.stock <= i.threshold;
                    return (
                      <TableRow key={i.id} className="align-middle">
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
                              variant="outline"
                              onClick={() => simulateDeduction(i.id)}
                              title="Simulate sale"
                            >
                              <MinusCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => reload(i.id)}
                              className="bg-gradient-accent text-accent-foreground"
                            >
                              <RotateCw className="mr-1 h-3.5 w-3.5" /> Load
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {menuItems
              .filter((m) => m.recipe.length > 0)
              .map((m) => {
                const margin = (((m.price - m.cost) / m.price) * 100).toFixed(
                  0,
                );
                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-border bg-card p-5 shadow-soft"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-primary">
                          {m.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.category}
                        </p>
                      </div>
                      <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-[11px] font-bold text-secondary">
                        {margin}% margin
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {m.recipe.map((r) => {
                        const ing = items.find((i) => i.id === r.ingredientId);
                        if (!ing) return null;
                        return (
                          <li
                            key={r.ingredientId}
                            className="flex justify-between text-foreground/80"
                          >
                            <span>{ing.name}</span>
                            <span className="font-medium">
                              {r.quantity} {ing.unit}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                      <span className="text-muted-foreground">Plate cost</span>
                      <span className="font-bold text-primary">
                        ₹{m.cost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
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

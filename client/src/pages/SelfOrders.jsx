import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AxiosAdmin from '@/utils/axiosAdmin';
import SummaryApi from '@/common/SummerAPI';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { MapPin, Phone, CreditCard, Banknote, ShoppingBag } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

const SelfOrders = () => {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const { data: allOrders = [], isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const response = await AxiosAdmin.get(SummaryApi.getOrders.url);
            return response.data;
        },
    });

    const selfOrders = useMemo(() => {
        return allOrders
            .filter(o => o.source === 'self-order' || o.customerPhone)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [allOrders]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-primary tracking-tight">Self Orders</h2>
                <p className="text-sm text-muted-foreground">Monitor and manage all QR Code and Online orders.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-bold uppercase tracking-wider text-xs">Order Details</TableHead>
                            <TableHead className="font-bold uppercase tracking-wider text-xs">Customer</TableHead>
                            <TableHead className="font-bold uppercase tracking-wider text-xs">Payment</TableHead>
                            <TableHead className="font-bold uppercase tracking-wider text-xs text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div></div>
                                </TableCell>
                            </TableRow>
                        ) : selfOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                    No self orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            selfOrders.map(order => (
                                <TableRow 
                                    key={order._id} 
                                    className="group cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="font-bold text-primary">{order.orderNumber}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                {format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")}
                                                {order.tableNumber && (
                                                    <span className="inline-flex items-center gap-0.5 ml-2 bg-accent/10 text-accent px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                                        <MapPin size={10} /> Table {order.tableNumber}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground pt-1">
                                                {order.items?.length || 0} items • ₹{order.totalAmount?.toFixed(2)}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="font-semibold text-primary text-sm">{order.customerName || 'Guest'}</div>
                                            {order.customerPhone && (
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Phone size={10} /> {order.customerPhone}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold capitalize text-primary">
                                                {order.paymentMethod === 'online' ? <CreditCard size={12} className="text-blue-500" /> : <Banknote size={12} className="text-emerald-500" />}
                                                {order.paymentMethod}
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${
                                                order.paymentStatus === 'completed' ? 'bg-success/10 text-success' : 
                                                order.paymentStatus === 'failed' ? 'bg-destructive/10 text-destructive' : 
                                                'bg-warning/10 text-warning'
                                            }`}>
                                                {order.paymentStatus}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                            ['delivered', 'completed'].includes(order.status) ? 'bg-success/10 text-success' :
                                            ['cancelled'].includes(order.status) ? 'bg-destructive/10 text-destructive' :
                                            'bg-accent/10 text-accent'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-md">
                    {selectedOrder && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-primary mb-1">Order Details</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="font-bold text-accent">{selectedOrder.orderNumber}</span>
                                    • {format(new Date(selectedOrder.createdAt), "dd MMM yyyy, hh:mm a")}
                                </p>
                            </div>

                            <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-primary pb-2 border-b border-border">
                                    <ShoppingBag size={16} />
                                    Ordered Items
                                </div>
                                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                                    {selectedOrder.items?.map((item, index) => (
                                        <div key={index} className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-semibold text-primary">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">Qty: {item.qty} × ₹{item.price?.toFixed(2)}</p>
                                            </div>
                                            <p className="text-sm font-bold text-primary">₹{(item.qty * item.price)?.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-3 border-t border-border flex justify-between items-center">
                                    <span className="text-sm font-bold text-muted-foreground">Total Amount</span>
                                    <span className="text-lg font-black text-primary">₹{selectedOrder.totalAmount?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SelfOrders;

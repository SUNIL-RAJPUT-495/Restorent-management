import React from 'react';
import { MapPin, Banknote, CreditCard, ChefHat, ArrowRight, CheckCircle } from 'lucide-react';
import { useQRContext } from './QRContext';
import axios from 'axios';
import { baseURL } from '../../common/SummerAPI';
import { toast } from 'sonner';

const QRPayment = () => {
    const { 
        selectedTable, cartCount, cartTotal, paymentMethod, setPaymentMethod, 
        cartItems, customerInfo, setOrderConfirmed, setStep, restaurantInfo, resetFlow
    } = useQRContext();

    const handlePlaceOrder = async () => {
        const toastId = toast.loading("Processing your order...");
        try {
            const orderPayload = {
                items: cartItems.map(item => ({
                    productId: item.product._id,
                    name: item.product.name,
                    price: item.product.price,
                    qty: item.qty
                })),
                type: 'qsr',
                tableNumber: selectedTable,
                totalAmount: cartTotal,
                customerName: customerInfo.name,
                customerPhone: customerInfo.phone,
                customerEmail: customerInfo.email,
            };

            if (paymentMethod === 'cash') {
                const payload = { ...orderPayload, paymentMethod: 'cash' };
                const res = await axios.post(`${baseURL}/api/public/order`, payload);
                setOrderConfirmed(res.data);
                localStorage.setItem('qr_last_order', JSON.stringify(res.data));
                // Clear cart after placing order
                localStorage.removeItem('qr_cart_data');
                toast.success("Order placed successfully!", { id: toastId });
                setStep(5);
            } else if (paymentMethod === 'online') {
                toast.loading("Redirecting to secure payment...", { id: toastId });
                const imbRes = await axios.post(`${baseURL}/api/public/payment/imb/create`, orderPayload);
                
                if (imbRes.data.success && imbRes.data.payment_url) {
                    toast.success("Payment gateway ready!", { id: toastId });
                    window.location.href = imbRes.data.payment_url;
                } else {
                    throw new Error(imbRes.data.message || "Failed to get payment URL");
                }
            }
        } catch (error) {
            console.error("Order failed:", error);
            const msg = error.response?.data?.message || error.message || "Something went wrong";
            toast.error(msg, { id: toastId });
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
            {/* Header Section */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Confirm & Pay</h2>
                <div className="flex items-center justify-center gap-2">
                    <div className="bg-accent/10 text-accent px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-accent/5">
                        <MapPin size={10} />
                        Table {selectedTable}
                    </div>
                    <div className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border border-slate-200/50">
                        {cartCount} Items
                    </div>
                </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="bg-white rounded-[32px] border border-slate-100 p-3 shadow-sm space-y-5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Payment Method</h4>
                <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
                    <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${paymentMethod === 'cash' 
                            ? 'bg-white text-accent shadow-md shadow-accent/5 font-black scale-[1.02]' 
                            : 'text-slate-400 font-bold hover:text-slate-600'}`}
                    >
                        <Banknote size={16} strokeWidth={3} />
                        <span className="text-[10px] uppercase tracking-widest">Cash</span>
                    </button>
                    <button
                        onClick={() => setPaymentMethod('online')}
                        className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${paymentMethod === 'online' 
                            ? 'bg-white text-accent shadow-md shadow-accent/5 font-black scale-[1.02]' 
                            : 'text-slate-400 font-bold hover:text-slate-600'}`}
                    >
                        <CreditCard size={16} strokeWidth={3} />
                        <span className="text-[10px] uppercase tracking-widest">Online</span>
                    </button>
                </div>
                <p className="text-[9px] text-center text-slate-300 font-bold italic tracking-wide">
                    {paymentMethod === 'cash' ? '*Pay at counter after your meal' : '*Safe & Secure UPI/Card Payments'}
                </p>
            </div>

            {/* Final Action Card */}
            <div className="bg-white rounded-[32px] border border-slate-100 p-5 shadow-2xl shadow-slate-200/50 space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <ChefHat size={80} />
                </div>
                
                <div className="space-y-0.5 relative z-10">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Payable Amount</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{cartTotal.toFixed(2)}</span>
                        <span className="text-[8px] font-bold text-green-500 uppercase tracking-widest italic">Incl. Taxes</span>
                    </div>
                </div>

                <button
                    onClick={handlePlaceOrder}
                    className="w-full bg-accent text-white rounded-xl py-3.5 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 relative z-10"
                >
                    Complete Order
                    <ArrowRight size={14} strokeWidth={4} />
                </button>

                <div className="pt-3 flex items-center justify-between border-t border-slate-50 relative z-10">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Instant Confirmation</span>
                    </div>
                    <div className="flex -space-x-1 grayscale opacity-30 scale-75 origin-right">
                        <div className="w-5 h-5 rounded-full border border-white bg-slate-100 flex items-center justify-center"><CheckCircle size={8} /></div>
                        <div className="w-5 h-5 rounded-full border border-white bg-slate-100 flex items-center justify-center"><Banknote size={8} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRPayment;

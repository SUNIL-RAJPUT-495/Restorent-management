import React from 'react';
import { ChefHat, MapPin, Plus, Minus, Info, User, CheckCircle, ArrowRight } from 'lucide-react';
import { useQRContext } from './QRContext';

const QRCart = () => {
    const { restaurantInfo, selectedTable, cartItems, removeFromCart, addToCart, setStep, preSelectedTable, cartSubtotal, cartTotal, cgstAmount, sgstAmount } = useQRContext();

    const cartOriginalSubtotal = cartItems.reduce((acc, item) => {
        const originalPrice = item.product.originalPrice || item.product.price;
        return acc + (originalPrice * item.qty);
    }, 0);
    const totalDiscount = cartOriginalSubtotal - cartSubtotal;

    // Guard: if cart is empty, send back to menu
    if (cartItems.length === 0) {
        setStep(1);
        return null;
    }

    return (
        <div className="max-w-xl mx-auto pb-32 animate-in slide-in-from-bottom-8 duration-700">
            {/* Restaurant Header */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                    <ChefHat size={24} />
                </div>
                <div>
                    <h2 className="font-black text-slate-900 text-lg leading-tight uppercase italic">{restaurantInfo?.restaurantName}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={10} className="text-accent" />
                        Dine-in • Table {selectedTable || 'Not Set'}
                    </p>
                </div>
            </div>

            {/* Items Card */}
            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm mb-4">
                <div className="divide-y divide-slate-50">
                    {cartItems.map(item => (
                        <div key={item.product._id} className="p-4 sm:p-6 flex items-start justify-between gap-4">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-inner">
                                    {item.product.image && <img src={item.product.image} className="w-full h-full object-cover" />}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-black text-slate-900 text-sm leading-tight">{item.product.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-accent font-black text-xs italic tracking-tighter">₹{item.product.price}</p>
                                        {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                                            <span className="text-[10px] text-slate-400 font-bold line-through tracking-tighter">₹{item.product.originalPrice}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-white shadow-lg shadow-slate-200/40 rounded-xl p-1 border border-slate-100 scale-90 sm:scale-100 origin-right">
                                <button onClick={() => removeFromCart(item.product._id)} className="w-8 h-8 text-slate-400 hover:text-accent flex items-center justify-center transition-all"><Minus size={14} strokeWidth={4} /></button>
                                <span className="font-black text-slate-900 w-6 text-center tabular-nums text-sm">{item.qty}</span>
                                <button onClick={() => addToCart(item.product)} className="w-8 h-8 text-slate-400 hover:text-accent flex items-center justify-center transition-all"><Plus size={14} strokeWidth={4} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add More Items Button */}
                <button 
                    onClick={() => setStep(1)}
                    className="w-full p-4 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors border-t border-slate-100 flex items-center justify-center gap-2"
                >
                    <Plus size={12} strokeWidth={4} />
                    Add More Items
                </button>
            </div>

            {/* Bill Details */}
            <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm space-y-4">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Info size={14} className="text-slate-300" />
                    Bill Summary
                </h4>
                
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Subtotal</span>
                        <span className="text-slate-900 font-black tracking-tighter text-sm">₹{cartOriginalSubtotal.toFixed(2)}</span>
                    </div>
                    {totalDiscount > 0 && (
                        <div className="flex justify-between items-center text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100/50">
                            <span>Promo Discount</span>
                            <span className="font-black tracking-tighter text-sm">-₹{totalDiscount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>GST ({(restaurantInfo?.cgst || 0) + (restaurantInfo?.sgst || 0)}%)</span>
                        <span className="text-slate-900 font-black tracking-tighter text-sm">₹{(cgstAmount + sgstAmount).toFixed(2)}</span>
                    </div>
                </div>

                <div className="pt-4 border-t-2 border-slate-50 border-dashed flex justify-between items-center">
                    <span className="font-black text-slate-900 text-xs uppercase tracking-wider">Grand Total</span>
                    <span className="font-black text-slate-900 text-2xl tracking-tighter">₹{cartTotal.toFixed(2)}</span>
                </div>
            </div>

            {/* Safety Policy */}
            <div className="mt-8 flex items-center justify-center gap-6 opacity-30 grayscale">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full border border-slate-900 flex items-center justify-center"><User size={14} /></div>
                    <span className="text-[8px] font-bold uppercase tracking-widest">Hygiene</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full border border-slate-900 flex items-center justify-center"><CheckCircle size={14} /></div>
                    <span className="text-[8px] font-bold uppercase tracking-widest">Verified</span>
                </div>
            </div>

            {/* Sticky Bottom CTA for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] animate-in slide-in-from-bottom-full duration-500">
                <div className="max-w-xl mx-auto">
                    <button
                        onClick={() => preSelectedTable ? setStep(4) : setStep(3)}
                        className="w-full bg-accent text-white rounded-[24px] py-5 px-8 font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-accent/40 flex items-center justify-between group hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] opacity-60 font-bold tracking-widest mb-1">Total to Pay</span>
                            <span className="text-xl tracking-tighter">₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span>Proceed</span>
                            <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRCart;

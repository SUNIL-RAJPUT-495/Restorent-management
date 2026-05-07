import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, ArrowLeft, CheckCircle, CreditCard, Banknote, MapPin, ChefHat, Search, Info, Plus, Minus, X, User, Phone, Mail, ArrowRight, Star, Sparkles, FileText } from 'lucide-react';
import { io } from 'socket.io-client';
import BillReceipt from '../components/BillReceipt';
import { baseURL } from '../common/SummerAPI';
import { toast } from 'sonner';

// Image Paths
const onboardingImage = "/onboarding.png";

const QROrderFlow = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preSelectedTable = searchParams.get('table');

    // Steps: 0: Onboarding, 1: Menu/Dashboard, 2: Cart, 3: Table, 4: Payment, 5: Success
    const [step, setStep] = useState(() => {
        const savedStep = localStorage.getItem('qr_current_step');
        return savedStep ? parseInt(savedStep) : 0;
    });

    useEffect(() => {
        localStorage.setItem('qr_current_step', step.toString());
    }, [step]);

    const [customerInfo, setCustomerInfo] = useState(() => {
        const saved = localStorage.getItem('qr_customer_info');
        return saved ? JSON.parse(saved) : { name: '', phone: '', email: '' };
    });

    const [menu, setMenu] = useState([]);
    const [tables, setTables] = useState([]);
    const [restaurantInfo, setRestaurantInfo] = useState(null);
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('qr_cart_data');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('qr_cart_data', JSON.stringify(cart));
    }, [cart]);
    const [selectedTable, setSelectedTable] = useState(preSelectedTable || null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [orderConfirmed, setOrderConfirmed] = useState(() => {
        const saved = localStorage.getItem('qr_last_order');
        return saved ? JSON.parse(saved) : null;
    });
    const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
    const [loading, setLoading] = useState(true);

    // Socket Connection for Real-time Tracking
    useEffect(() => {
        if (step === 5) {
            const socket = io(baseURL);
            
            socket.on('connect', () => console.log('QR Flow Connected to WebSocket'));
            
            socket.on('orderUpdated', (updatedOrder) => {
                console.log('QR Flow received orderUpdated via Socket:', updatedOrder);
                
                setOrderConfirmed((prev) => {
                    if (prev && prev.orderNumber === updatedOrder.orderNumber) {
                        localStorage.setItem('qr_last_order', JSON.stringify(updatedOrder));
                        
                        if (updatedOrder.status === 'delivered') {
                            setTimeout(() => {
                                setStep(6); // Transition to feedback
                            }, 2000);
                        }
                        return updatedOrder;
                    }
                    return prev;
                });
            });

            return () => socket.disconnect();
        }
    }, [step]);

    const handlePrintBill = () => {
        window.print();
    };

    const submitFeedback = async () => {
        try {
            const lastOrder = JSON.parse(localStorage.getItem('qr_last_order'));
            await axios.post(`${baseURL}/api/public/feedback`, {
                orderNumber: lastOrder?.orderNumber,
                rating: feedback.rating,
                comment: feedback.comment,
                customerName: customerInfo?.name,
                customerPhone: customerInfo?.phone
            });
            toast.success("Thank you for your valuable feedback!");
        } catch (error) {
            console.error("Feedback error", error);
            toast.error("Failed to save feedback, but thank you anyway!");
        } finally {
            setCart({});
            setOrderConfirmed(null);
            localStorage.removeItem('qr_cart_data');
            localStorage.removeItem('qr_current_step');
            localStorage.removeItem('qr_last_order');
            setStep(1);
            setFeedback({ rating: 0, comment: '' });
        }
    };

    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const { orderNumber: urlOrderNumber } = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // If we have an order number in URL, verify it first
                if (urlOrderNumber) {
                    const vToastId = toast.loading("Verifying payment...");
                    try {
                        const verifyRes = await axios.post(`${baseURL}/api/public/payment/imb/verify`, { orderNumber: urlOrderNumber });
                        if (verifyRes.data.success && verifyRes.data.order) {
                            setOrderConfirmed(verifyRes.data.order);
                            setStep(5);
                            toast.success("Payment Verified!", { id: vToastId });
                            setLoading(false);
                            return; // Stop further data fetching if we are on success screen
                        } else if (verifyRes.data.status === 'pending') {
                            toast.loading("Payment is still processing...", { id: vToastId });
                        } else {
                            toast.error("Payment verification failed", { id: vToastId });
                        }
                    } catch (err) {
                        console.error("Verification failed:", err);
                        toast.error("Verification failed", { id: vToastId });
                    }
                }

                // Fetch menu and tables - these are critical
                const [menuRes, tablesRes] = await Promise.all([
                    axios.get(`${baseURL}/api/public/menu`),
                    axios.get(`${baseURL}/api/public/tables`),
                ]);

                const menuData = Array.isArray(menuRes.data) ? menuRes.data : (menuRes.data?.items || []);
                const tablesData = Array.isArray(tablesRes.data) ? tablesRes.data : [];

                setMenu(menuData);
                setTables(tablesData);

                // Fetch restaurant info separately so it doesn't block menu
                try {
                    const infoRes = await axios.get(`${baseURL}/api/public/info`);
                    setRestaurantInfo(infoRes.data);
                } catch (infoErr) {
                    console.warn("Could not load restaurant info:", infoErr.message);
                    setRestaurantInfo({ restaurantName: "Restaurant" });
                }

                // Move to menu only if no step is saved and onboarding is done
                if (!localStorage.getItem('qr_current_step') && customerInfo.name && customerInfo.phone) {
                    setStep(1);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleOnboarding = (e) => {
        e.preventDefault();
        if (!customerInfo.name || !customerInfo.phone) return;
        localStorage.setItem('qr_customer_info', JSON.stringify(customerInfo));
        setStep(1);
    };

    const categories = useMemo(() => {
        const cats = ['All', ...new Set(menu.map(item => item.category))];
        return cats;
    }, [menu]);

    const filteredMenu = useMemo(() => {
        return menu.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [menu, activeCategory, searchQuery]);

    const addToCart = (product) => {
        setCart(prev => ({
            ...prev,
            [product._id]: {
                product,
                qty: (prev[product._id]?.qty || 0) + 1
            }
        }));
    };

    const removeFromCart = (productId) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[productId]?.qty > 1) {
                newCart[productId].qty -= 1;
            } else {
                delete newCart[productId];
            }
            return newCart;
        });
    };

    const cartItems = Object.values(cart);
    const cartSubtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

    const cgstAmount = (cartSubtotal * (restaurantInfo?.cgst || 0)) / 100;
    const sgstAmount = (cartSubtotal * (restaurantInfo?.sgst || 0)) / 100;
    const cartTotal = cartSubtotal + cgstAmount + sgstAmount;

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

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-white text-accent flex-col gap-4 font-sans">
            <ChefHat size={40} className="animate-bounce" />
            <p className="font-bold uppercase tracking-widest text-[8px] animate-pulse">Syncing...</p>
        </div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-accent/20">

            {/* ONBOARDING STEP (0) */}
            {step === 0 && (
                <div className="h-screen w-full relative flex items-center justify-center overflow-hidden animate-in fade-in duration-700">
                    <div className="absolute inset-0 z-0">
                        <img src={onboardingImage} alt="Bg" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"></div>
                    </div>

                    <div className="relative z-10 w-full max-w-[360px] px-4">
                        <div className="bg-white/10 backdrop-blur-[30px] p-8 rounded-[40px] border border-white/20 shadow-2xl space-y-8 text-center">
                            <div className="space-y-3">
                                <div className="w-10 h-10 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto border border-accent/30">
                                    <Sparkles className="text-accent" size={20} />
                                </div>
                                <h1 className="text-xl font-black text-white tracking-tight uppercase italic">
                                    Welcome to <br /> {restaurantInfo?.restaurantName}
                                </h1>
                            </div>

                            <form onSubmit={handleOnboarding} className="space-y-4">
                                <input
                                    type="text"
                                    required
                                    value={customerInfo.name}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    placeholder="Full Name"
                                    className="w-full px-6 py-4 rounded-2xl border border-white/10 bg-white/5 focus:bg-white/10 focus:border-accent/50 transition-all outline-none font-bold text-white placeholder:text-white/20 text-sm"
                                />
                                <input
                                    type="tel"
                                    required
                                    value={customerInfo.phone}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                    placeholder="Phone Number"
                                    className="w-full px-6 py-4 rounded-2xl border border-white/10 bg-white/5 focus:bg-white/10 focus:border-accent/50 transition-all outline-none font-bold text-white placeholder:text-white/20 text-sm"
                                />
                                <button type="submit" className="w-full bg-accent text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest shadow-xl shadow-accent/20">
                                    Open Menu
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Order Flow Content (Step 1-5) */}
            {step > 0 && (
                <div className="pb-32">
                    <header className="bg-white sticky top-0 z-50 px-6 py-4 border-b border-slate-100 shadow-sm">
                        <div className="max-w-7xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {step > 1 && step < 5 && (
                                    <button onClick={() => {
                                        if (step === 4 && preSelectedTable) setStep(2);
                                        else setStep(step - 1);
                                    }} className="text-slate-400 hover:text-accent transition-colors">
                                        <ArrowLeft size={18} />
                                    </button>
                                )}
                                <h1 className="text-lg font-black tracking-tighter text-slate-900 uppercase">
                                    {step === 5 ? 'Order Token' : (restaurantInfo?.restaurantName)}
                                </h1>
                            </div>

                            <button
                                className="relative w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-accent/20"
                                onClick={() => step === 1 && cartCount > 0 && setStep(2)}
                            >
                                <ShoppingCart size={18} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-white text-accent text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-accent animate-in zoom-in duration-300">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </header>

                    <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
                        {step === 1 && (
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Compact Categories */}
                                <div className="lg:w-56 shrink-0 space-y-4">
                                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 no-scrollbar">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setActiveCategory(cat)}
                                                className={`px-5 py-3 rounded-xl text-[10px] font-black transition-all whitespace-nowrap text-left ${activeCategory === cat
                                                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                                    : 'bg-white text-slate-400 border border-slate-100'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Small Item Cards */}
                                <div className="flex-grow">
                                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">{activeCategory}</h2>
                                        <div className="relative group w-full md:w-64">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all font-bold text-slate-700 placeholder:text-slate-200"
                                            />
                                        </div>
                                    </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredMenu.map(product => (
                                <button
                                    key={product._id}
                                    onClick={() => !cart[product._id] && addToCart(product)}
                                    className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-3 text-center transition-all hover:-translate-y-1 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 active:scale-95"
                                >
                                    <div className="w-full aspect-square mb-3 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 flex items-center justify-center relative">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <ChefHat size={32} className="text-slate-200" />
                                        )}
                                        
                                        {/* Simple Overlay if in Cart */}
                                        {cart[product._id] && (
                                            <div className="absolute inset-0 bg-accent/10 backdrop-blur-[2px] animate-in fade-in duration-300">
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full space-y-1">
                                        <h3 className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="text-sm font-black text-accent italic tracking-tighter">
                                                ₹{product.price}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-3 w-full">
                                        {cart[product._id] ? (
                                            <div className="flex items-center justify-between bg-slate-50 rounded-lg p-1 border border-slate-100">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); removeFromCart(product._id); }} 
                                                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-accent hover:bg-white rounded-md transition-all shadow-sm"
                                                >
                                                    <Minus size={12} strokeWidth={4} />
                                                </button>
                                                <span className="font-black text-slate-900 text-xs tabular-nums">
                                                    {cart[product._id].qty}
                                                </span>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
                                                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-accent hover:bg-white rounded-md transition-all shadow-sm"
                                                >
                                                    <Plus size={12} strokeWidth={4} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full py-2 bg-slate-50 text-slate-400 font-black rounded-lg text-[9px] uppercase tracking-widest border border-slate-100 group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all">
                                                Add
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                )}

                        {/* Step 2: Swiggy-style Cart View */}
                        {step === 2 && (
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
                                                        <p className="text-accent font-black text-xs italic tracking-tighter">₹{item.product.price}</p>
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
                                            <span>Item Total</span>
                                            <span className="text-slate-900 font-black tracking-tighter text-sm">₹{cartSubtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span>GST ({restaurantInfo?.cgst + restaurantInfo?.sgst || 0}%)</span>
                                            <span className="text-slate-900 font-black  tracking-tighter text-sm">₹{(cgstAmount + sgstAmount).toFixed(2)}</span>
                                        </div>
                                        
                                    </div>

                                    <div className="pt-4 border-t-2 border-slate-50 border-dashed flex justify-between items-center">
                                        <span className="font-black text-slate-900 text-xs uppercase tracking-wider  ">Grand Total</span>
                                        <span className="font-black text-slate-900 text-2xl  tracking-tighter">₹{cartTotal.toFixed(2)}</span>
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
                                <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-[100] animate-in slide-in-from-bottom-full duration-500">
                                    <div className="max-w-xl mx-auto">
                                        <button
                                            onClick={() => preSelectedTable ? setStep(4) : setStep(3)}
                                            className="w-full bg-accent text-white rounded-[24px] py-5 px-8 font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-accent/40 flex items-center justify-between group hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            <div className="flex flex-col items-start leading-none">
                                                <span className="text-[10px] opacity-60 font-bold tracking-widest mb-1">Total to Pay</span>
                                                <span className="text-xl  tracking-tighter">₹{cartTotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span>Proceed</span>
                                                <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Table Selection (if not pre-selected) */}
                        {step === 3 && ( 
                            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-900  uppercase tracking-tighter text-center">Confirm Table</h2>
                                    <p className="text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">Where are you seated?</p>
                                </div>

                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {tables.map(table => (
                                        <button
                                            key={table.number}
                                            onClick={() => setSelectedTable(table.number)}
                                            className={`aspect-square rounded-[32px] flex flex-col items-center justify-center gap-2 transition-all border-2 ${selectedTable === table.number
                                                    ? 'bg-accent border-accent text-white shadow-xl shadow-accent/20 scale-105'
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-accent/30'
                                                }`}
                                        >
                                            <MapPin size={20} className={selectedTable === table.number ? 'text-white' : 'text-slate-300'} />
                                            <span className="font-black text-lg tracking-tighter">{table.number}</span>
                                        </button>
                                    ))}
                                </div>

                                {selectedTable && (
                                    <button
                                        onClick={() => setStep(4)}
                                        className="w-full bg-accent text-white rounded-[28px] py-6 font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-accent/30 mt-8"
                                    >
                                        Confirm Table {selectedTable}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Step 4: Premium Compact Checkout */}
                        {step === 4 && (
                            <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
                                {/* Header Section */}
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-black text-slate-900  uppercase tracking-tighter">Confirm & Pay</h2>
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

                                {/* Payment Mode Selection (Compact) */}
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
                                            <span className="text-3xl font-black text-slate-900  tracking-tighter">₹{cartTotal.toFixed(2)}</span>
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
                        )}

                        {/* Step 5: Modern Success & Live Tracking Screen */}
                        {step === 5 && orderConfirmed && (
                            <div className="max-w-md mx-auto text-center space-y-8 py-5 animate-in fade-in zoom-in duration-1000 print:space-y-4 print:py-0">
                                {/* Success Animation & Header */}
                                <div className="space-y-4 print:hidden">
                                    <div className="relative inline-block">
                                        <div className="absolute inset-0 bg-accent rounded-full blur-3xl opacity-20 animate-pulse"></div>
                                        <div className="relative w-20 h-20 bg-accent text-white rounded-[28px] flex items-center justify-center mx-auto shadow-2xl shadow-accent/40 rotate-12 transition-transform hover:scale-110">
                                            {orderConfirmed.status === 'preparing' ? <ChefHat size={40} className="-rotate-12 animate-pulse" /> : 
                                             orderConfirmed.status === 'ready' ? <Sparkles size={40} className="-rotate-12 animate-pulse text-yellow-300" /> :
                                             <CheckCircle size={40} strokeWidth={3} className="-rotate-12" />}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">
                                            {orderConfirmed.status === 'preparing' ? 'Preparing!' :
                                             orderConfirmed.status === 'ready' ? 'Ready!' :
                                             'Ordered!'}
                                        </h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                                            {orderConfirmed.status === 'preparing' ? 'Chef is cooking your feast' :
                                             orderConfirmed.status === 'ready' ? 'Your food is ready to be served' :
                                             'Kitchen received your order'}
                                        </p>
                                    </div>
                                </div>

                                {/* Live Status Stepper */}
                                <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm relative overflow-hidden print:hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-50" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 relative z-10">Live Status</h3>
                                    
                                    <div className="flex justify-between items-center relative z-10">
                                        {/* Background Track */}
                                        <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 -translate-y-1/2 rounded-full z-0" />
                                        
                                        {/* Progress Track */}
                                        <div className="absolute top-1/2 left-4 h-1 bg-accent -translate-y-1/2 rounded-full z-0 transition-all duration-1000 ease-in-out" 
                                            style={{ 
                                                width: orderConfirmed.status === 'new' ? '0%' : 
                                                       orderConfirmed.status === 'preparing' ? '33%' : 
                                                       orderConfirmed.status === 'ready' ? '66%' : '100%' 
                                            }} 
                                        />

                                        {[
                                            { id: 'new', icon: CheckCircle, label: 'Confirmed' },
                                            { id: 'preparing', icon: ChefHat, label: 'Preparing' },
                                            { id: 'ready', icon: Sparkles, label: 'Ready' },
                                            { id: 'delivered', icon: MapPin, label: 'Served' }
                                        ].map((s, index) => {
                                            const statusOrder = ['new', 'preparing', 'ready', 'delivered'];
                                            const currentIndex = statusOrder.indexOf(orderConfirmed.status || 'new');
                                            const isCompleted = index <= currentIndex;
                                            const isCurrent = index === currentIndex;
                                            const Icon = s.icon;
                                            
                                            return (
                                                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${isCompleted ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30 scale-110' : 'bg-white border-slate-200 text-slate-300'}`}>
                                                        <Icon size={14} className={isCurrent && orderConfirmed.status !== 'delivered' ? 'animate-pulse' : ''} />
                                                    </div>
                                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${isCompleted ? 'text-accent' : 'text-slate-300'}`}>{s.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Unified Bill Receipt */}
                                <div className="mx-4 overflow-hidden rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 print:mx-0 print:shadow-none print:border-none print:rounded-none bg-white">
                                    <BillReceipt 
                                        billData={{ activeOrder: orderConfirmed, tableNumber: selectedTable }} 
                                        settings={restaurantInfo} 
                                        onClose={() => {
                                            setCart({});
                                            setOrderConfirmed(null);
                                            localStorage.removeItem('qr_cart_data');
                                            localStorage.removeItem('qr_current_step');
                                            localStorage.removeItem('qr_last_order');
                                            setStep(1);
                                        }} 
                                        actionType="download"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 6: Feedback Screen */}
                        {step === 6 && (
                            <div className="max-w-md mx-auto text-center space-y-8 py-10 animate-in slide-in-from-bottom-8 duration-700">
                                <div className="space-y-4">
                                    <div className="w-20 h-20 bg-accent/10 text-accent rounded-[28px] flex items-center justify-center mx-auto shadow-inner border border-accent/20">
                                        <Star size={40} className="fill-accent/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Give Feedback</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">How was your experience?</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 space-y-8">
                                    <div className="flex justify-center gap-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setFeedback({ ...feedback, rating: star })}
                                                className={`transition-all hover:scale-110 active:scale-90 ${feedback.rating >= star ? 'text-yellow-400' : 'text-slate-200'}`}
                                            >
                                                <Star size={32} className={feedback.rating >= star ? 'fill-yellow-400 drop-shadow-md' : ''} />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-3 text-left">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Comments</label>
                                        <textarea 
                                            value={feedback.comment}
                                            onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                                            placeholder="Tell us what you loved..."
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all resize-none h-28 placeholder:text-slate-300"
                                        ></textarea>
                                    </div>

                                    <button
                                        onClick={submitFeedback}
                                        disabled={!feedback.rating}
                                        className="w-full bg-accent text-white rounded-2xl py-4 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        Submit Feedback
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Floating Cart Bar (Mobile) */}
                        {step === 1 && cartCount > 0 && (
                            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50">
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full bg-accent text-white rounded-2xl p-3 font-black shadow-2xl shadow-accent/30 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <ShoppingCart size={24} />
                                            <span className="absolute -top-2 -right-2 bg-white text-accent w-5 h-5 rounded-full border-2 border-orange-300 text-[8px] flex items-center justify-center font-black">{cartCount}</span>
                                        </div>
                                        <span className="text-sm uppercase tracking-widest italic">View Cart</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-black italic tracking-tighter">₹{cartTotal.toFixed(2)}</span>
                                        <ArrowRight size={20} strokeWidth={3} />
                                    </div>
                                </button>
                            </div>
                        )}
            </main>
                </div>
            )}
        </div>
    );
};

export default QROrderFlow;


import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChefHat, Plus, Minus, Sparkles, ArrowRight, CheckCircle, MapPin } from 'lucide-react';
import { useQRContext } from './QRContext';
import { toast } from 'sonner';



const QRMenu = () => {
    const { menu, isLoading, cart, addToCart, removeFromCart, setStep, orderConfirmed, promotions } = useQRContext();
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPromoIdx, setCurrentPromoIdx] = useState(0);
    const [bannerVisible, setBannerVisible] = useState(true);

    const handleBannerClick = (promo) => {
        if (!promo.productId) {
            toast.info("Special Offer banner!");
            return;
        }

        const product = typeof promo.productId === 'object' ? promo.productId : menu.find(p => p._id === promo.productId);
        if (!product) {
            return;
        }

        // Add to cart
        addToCart(product);
        toast.success(`Added ${product.name} to cart! 🍕`, {
            description: "Promotional Offer applied",
            icon: <Sparkles className="h-4 w-4 text-accent animate-bounce" />
        });

        // Scroll to product card and highlight it
        setTimeout(() => {
            const element = document.getElementById(`product-card-${product._id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Flash class
                element.classList.add('ring-4', 'ring-accent', 'scale-[1.02]');
                setTimeout(() => {
                    element.classList.remove('ring-4', 'ring-accent', 'scale-[1.02]');
                }, 1500);
            }
        }, 300);
    };

    useEffect(() => {
        if (orderConfirmed?.status === 'delivered') {
            const timer = setTimeout(() => {
                setBannerVisible(false);
            }, 5000); // 5 seconds
            return () => clearTimeout(timer);
        } else {
            setBannerVisible(true);
        }
    }, [orderConfirmed?.status]);

    // Auto-rotate the promotional image banners every 4 seconds
    useEffect(() => {
        const imagePromos = promotions.filter(p => p.image);
        if (imagePromos.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentPromoIdx((prev) => (prev + 1) % imagePromos.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [promotions]);

    const handleCategoryChange = (cat) => {
        setActiveCategory(cat);
    };

    const categories = useMemo(() => {
        const availableItems = menu.filter(item => item.available !== false);
        const cats = ['All', ...new Set(availableItems.map(item => item.category))];
        return cats;
    }, [menu]);

    const filteredMenu = useMemo(() => {
        return menu.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const isAvailable = item.available !== false;
            return matchesCategory && matchesSearch && isAvailable;
        });
    }, [menu, activeCategory, searchQuery]);

    const sortedMenu = useMemo(() => {
        return filteredMenu;
    }, [filteredMenu]);

    const SkeletonCard = () => (
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-3 text-center">
            <div className="w-full aspect-square mb-3 rounded-xl bg-slate-100 animate-pulse"></div>
            <div className="w-full space-y-2">
                <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4 mx-auto"></div>
                <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2 mx-auto"></div>
            </div>
            <div className="mt-3 w-full h-8 bg-slate-50 rounded-lg animate-pulse"></div>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500 pb-24">
            <div className="sticky top-[57px] z-40 bg-slate-50/95 backdrop-blur-md pt-3 pb-3 shadow-sm border-b border-slate-200/50">
                <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-5">

            {orderConfirmed && bannerVisible && (
                <button
                    type="button"
                    onClick={() => setStep(5)}
                    aria-label="View order status"
                    className="mb-2 md:mb-3 w-full rounded-xl border border-accent/20 bg-white px-3 py-2.5 shadow-sm shadow-accent/5 cursor-pointer hover:border-accent/35 active:scale-[0.99] transition-all text-left relative overflow-hidden group flex flex-col"
                >
                    <div className="relative px-2 pb-1">
                        <div className="absolute top-3 left-5 right-5 h-0.5 bg-slate-100 -translate-y-1/2 rounded-full z-0">
                            <div
                                className="h-full bg-accent rounded-full transition-all duration-1000 ease-in-out"
                                style={{
                                    width: (orderConfirmed.status || 'new') === 'new' ? '0%' :
                                        orderConfirmed.status === 'preparing' ? '33.33%' :
                                            orderConfirmed.status === 'ready' ? '66.66%' : '100%'
                                }}
                            />
                        </div>
                        <div className="flex justify-between items-center relative z-10">
                            {[
                                { id: 'new', icon: CheckCircle, label: 'Conf' },
                                { id: 'preparing', icon: ChefHat, label: 'Prep' },
                                { id: 'ready', icon: Sparkles, label: 'Ready' },
                                { id: 'delivered', icon: MapPin, label: 'Srvd' }
                            ].map((s, index) => {
                                const statusOrder = ['new', 'preparing', 'ready', 'delivered'];
                                const currentIndex = statusOrder.indexOf(orderConfirmed.status || 'new');
                                const isCompleted = index <= currentIndex;
                                const isCurrent = index === currentIndex;
                                const Icon = s.icon;
                                return (
                                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-1.5">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 border-[1.5px] bg-white ${isCompleted ? 'border-accent text-accent shadow-md shadow-accent/20 scale-110' : 'border-slate-200 text-slate-300'}`}>
                                            <Icon size={10} className={isCurrent && orderConfirmed.status !== 'delivered' ? 'animate-pulse' : ''} />
                                        </div>
                                        <span className={`text-[7px] font-bold uppercase tracking-wider ${isCompleted ? 'text-accent' : 'text-slate-300'}`}>{s.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </button>
            )}

            <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
                <div className="lg:w-48 shrink-0 space-y-2">
                    <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1.5 lg:pb-0 no-scrollbar">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-10 w-24 lg:w-full bg-slate-100 rounded-xl animate-pulse shrink-0"></div>
                            ))
                        ) : (
                            categories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`px-3.5 py-2 rounded-lg text-[9px] font-black transition-all whitespace-nowrap text-left ${activeCategory === cat
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                        : 'bg-white text-slate-400 border border-slate-100'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex-grow">
                    <div className="mb-2">
                        <div className="relative w-full md:max-w-md md:ml-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                            <input
                                type="text"
                                placeholder="Search for dishes"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-100 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                </div>
                </div>
            </div>
            </div>



            <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-5 pt-2 w-full animate-in fade-in duration-700">
                {/* Clean, Full-bleed homepage promotional banner carousel (Shows only the uploaded images) */}
                {!isLoading && promotions && promotions.length > 0 && activeCategory === 'All' && !searchQuery && (() => {
                    const imagePromos = promotions.filter(p => p.image);
                    if (imagePromos.length === 0) return null;

                    // Ensure the active index wraps around boundary safe
                    const activeIdx = currentPromoIdx % imagePromos.length;
                    const promo = imagePromos[activeIdx];

                    return (
                        <div className="mb-5 relative overflow-hidden rounded-2xl md:rounded-3xl shadow-md border border-slate-100/80 transition-all duration-300">
                            <button
                                type="button"
                                onClick={() => handleBannerClick(promo)}
                                className="w-full relative overflow-hidden block aspect-[21/9] md:aspect-[2.5/1] bg-slate-100 active:scale-[0.99] transition-all duration-300 group"
                            >
                                <img
                                    src={promo.image}
                                    alt={promo.title || "Restaurant Promotion"}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                                />
                            </button>

                            {/* Dot indicators for multiple image banners */}
                            {imagePromos.length > 1 && (
                                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
                                    {imagePromos.map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setCurrentPromoIdx(idx)}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                activeIdx === idx 
                                                    ? 'w-4 bg-white shadow-md' 
                                                    : 'w-1.5 bg-white/40 hover:bg-white/60'
                                            }`}
                                            aria-label={`Go to slide ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-3">
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                            ) : (
                                sortedMenu.map(product => (
                                    <button
                                        type="button"
                                        id={`product-card-${product._id}`}
                                        key={product._id}
                                        onClick={() => !cart[product._id] && addToCart(product)}
                                        className={`group flex flex-col items-center rounded-xl border bg-white p-2 text-center transition-all duration-300 hover:border-accent/25 hover:shadow-md active:scale-[0.98] ${cart[product._id] ? 'ring-1 ring-inset ring-accent/45 border-accent/25' : 'border-slate-100'
                                            }`}
                                    >
                                        <div className="w-full aspect-square mb-2 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50 flex items-center justify-center relative">
                                            {product.image ? (
                                                <img src={product.image} loading="lazy" alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                                            ) : (
                                                <ChefHat size={32} className="text-slate-200" />
                                            )}
                                            {product.originalPrice > product.price && (
                                                <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-red-500 to-[#ff4747] text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm z-10">
                                                    SALE
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full flex justify-between items-start gap-1 text-left">
                                            <h4 className="text-[11px] leading-tight font-black text-slate-800 uppercase tracking-tight line-clamp-2 flex-1">
                                                {product.name}
                                            </h4>
                                            <div className="flex flex-col items-end shrink-0">
                                                <span className="text-sm font-black text-accent tracking-tighter">
                                                    ₹{product.price}
                                                </span>
                                                {product.originalPrice > product.price && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <span className="text-[9px] text-slate-400 line-through font-semibold">
                                                            ₹{product.originalPrice}
                                                        </span>
                                                        <span className="text-[8px] bg-red-50 text-red-600 font-bold px-1 rounded-sm border border-red-100 whitespace-nowrap">
                                                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-2 w-full">
                                            {cart[product._id] ? (
                                                <div className="flex items-center justify-between bg-slate-50 rounded-lg p-1 border border-slate-100">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeFromCart(product._id); }}
                                                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-accent hover:bg-white rounded-md transition-all shadow-sm"
                                                    >
                                                        <Minus size={12} strokeWidth={4} />
                                                    </button>
                                                    <span className="font-black text-slate-900 text-xs tabular-nums">
                                                        {cart[product._id].qty}
                                                    </span>
                                                    <button
                                                        type="button"
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
                                ))
                            )}
                        </div>
                    </div>
                </div>
    );
};

export default QRMenu;

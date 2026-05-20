import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChefHat, Plus, Minus, Sparkles } from 'lucide-react';
import { useQRContext } from './QRContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

const PromoProductCard = ({ product, cart, addToCart, removeFromCart, compact, strip }) => (
    <button
        type="button"
        key={product._id}
        onClick={() => !cart[product._id] && addToCart(product)}
        className={`group flex flex-col items-center border bg-white text-center transition-all active:scale-[0.98] ${
            strip
                ? `min-w-[76px] max-w-[76px] shrink-0 rounded-lg border-slate-200/90 p-1 shadow-none hover:border-slate-300${cart[product._id] ? ' ring-1 ring-inset ring-accent/45' : ''}`
                : compact
                    ? `p-2 min-w-[108px] shrink-0 rounded-xl border-accent/15 hover:border-accent/30 hover:shadow-md${cart[product._id] ? ' ring-1 ring-inset ring-accent/45' : ''}`
                    : `p-3 rounded-2xl border-accent/20 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg${cart[product._id] ? ' ring-1 ring-inset ring-accent/45' : ''}`
        }`}
    >
        <div
            className={`w-full overflow-hidden flex-shrink-0 bg-slate-50 flex items-center justify-center relative rounded-md ${
                strip ? 'h-14 mb-0.5' : compact ? 'h-[4.25rem] mb-1 rounded-lg' : 'aspect-square mb-2 rounded-xl'
            }`}
        >
            {product.image ? (
                <img src={product.image} loading="lazy" alt={product.name} className="w-full h-full object-cover" />
            ) : (
                <ChefHat size={strip ? 18 : compact ? 22 : 32} className="text-slate-200" />
            )}
            <span
                className={`absolute rounded bg-accent text-white font-black uppercase shadow-sm ${
                    strip ? 'top-0.5 left-0.5 text-[6px] px-1 py-px tracking-wide' : 'top-2 left-2 text-[8px] px-1.5 py-0.5 tracking-[0.15em]'
                }`}
            >
                Promo
            </span>
        </div>
        <h3
            className={`font-bold text-slate-800 truncate w-full px-0.5 leading-tight ${
                strip ? 'text-[8px] normal-case tracking-tight mt-0.5' : 'text-[10px] font-black uppercase tracking-tight'
            }`}
        >
            {product.name}
        </h3>
        <span className={`font-black text-accent ${strip ? 'text-[9px] leading-none mt-0.5' : 'text-xs italic tracking-tighter'}`}>
            ₹{product.price}
        </span>
        <div className={strip ? 'mt-1 w-full' : 'mt-2 w-full'}>
            {cart[product._id] ? (
                <div
                    className={`flex items-center justify-between bg-slate-50 border border-slate-100 ${
                        strip ? 'rounded-md p-0.5' : 'rounded-lg p-1'
                    }`}
                >
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFromCart(product._id); }}
                        className={`flex items-center justify-center text-slate-400 hover:text-accent hover:bg-white rounded transition-all ${
                            strip ? 'w-5 h-5' : 'w-6 h-6'
                        }`}
                    >
                        <Minus size={strip ? 8 : 10} strokeWidth={4} />
                    </button>
                    <span className={`font-black text-slate-900 tabular-nums ${strip ? 'text-[8px]' : 'text-[10px]'}`}>
                        {cart[product._id].qty}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        className={`flex items-center justify-center text-slate-400 hover:text-accent hover:bg-white rounded transition-all ${
                            strip ? 'w-5 h-5' : 'w-6 h-6'
                        }`}
                    >
                        <Plus size={strip ? 8 : 10} strokeWidth={4} />
                    </button>
                </div>
            ) : (
                <div
                    className={
                        strip
                            ? 'w-full py-0.5 rounded font-black bg-accent text-white border border-accent text-[7px] uppercase tracking-wide transition-all'
                            : 'w-full py-1.5 rounded-lg font-black bg-accent/10 text-accent border border-accent/20 text-[8px] uppercase tracking-widest transition-all group-hover:bg-accent group-hover:text-white group-hover:border-accent'
                    }
                >
                    ADD
                </div>
            )}
        </div>
    </button>
);

const QRMenu = () => {
    const { menu, isLoading, cart, addToCart, removeFromCart, setStep, orderConfirmed, setPromoModalOpen } = useQRContext();
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showPromoModal, setShowPromoModal] = useState(false);

    const promotedItems = useMemo(() => {
        return menu.filter((item) => item.promotion && item.available !== false);
    }, [menu]);

    const promosInView = useMemo(() => {
        if (activeCategory === 'All') return promotedItems;
        return promotedItems.filter((item) => item.category === activeCategory);
    }, [promotedItems, activeCategory]);

    useEffect(() => {
        if (isLoading) return;
        const modalSeen = sessionStorage.getItem('qr_promo_modal_seen') === '1';
        if (promotedItems.length > 0 && !modalSeen) {
            setShowPromoModal(true);
        }
    }, [isLoading, promotedItems.length]);

    useEffect(() => {
        if (!showPromoModal) return;
        // #region agent log
        fetch('http://127.0.0.1:7791/ingest/eae95dce-fe21-44c4-8d93-dcd008b62678', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'edcefc' },
            body: JSON.stringify({
                sessionId: 'edcefc',
                location: 'QRMenu.jsx:promo-modal',
                message: 'promo_modal_open',
                data: { dialogZ: 110, floatingCartZ: 60, headerZ: 50 },
                hypothesisId: 'H_STACK',
                timestamp: Date.now(),
                runId: 'post-zindex-fix',
            }),
        }).catch(() => {});
        // #endregion
    }, [showPromoModal]);

    useEffect(() => {
        setPromoModalOpen(showPromoModal);
        return () => setPromoModalOpen(false);
    }, [showPromoModal, setPromoModalOpen]);

    const handlePromoModalChange = (open) => {
        setShowPromoModal(open);
        if (!open) {
            sessionStorage.setItem('qr_promo_modal_seen', '1');
        }
    };

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
        return [...filteredMenu].sort((a, b) => {
            if (a.promotion && !b.promotion) return -1;
            if (!a.promotion && b.promotion) return 1;
            return 0;
        });
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
        <div className="max-w-7xl mx-auto px-3 py-2.5 md:px-4 md:py-3 lg:px-5 animate-in fade-in duration-500 pb-24">
            <Dialog open={showPromoModal} onOpenChange={handlePromoModalChange}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col rounded-3xl border-accent/20 p-0 gap-0 sm:max-w-lg">
                    <DialogHeader className="p-6 pb-3 text-left border-b border-slate-100">
                        <DialogTitle className="text-lg font-black uppercase italic tracking-tight text-slate-900">
                            Today&apos;s Offers
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-slate-400">
                            Special promoted items — add to your order
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto p-4 grid grid-cols-2 gap-3">
                        {promotedItems.map((product) => (
                            <PromoProductCard
                                key={product._id}
                                product={product}
                                cart={cart}
                                addToCart={addToCart}
                                removeFromCart={removeFromCart}
                            />
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {orderConfirmed && orderConfirmed.status !== 'delivered' && (
                <button
                    type="button"
                    onClick={() => setStep(5)}
                    aria-label="View order status"
                    className="mb-2 md:mb-3 w-full rounded-lg border border-accent/20 bg-white px-2.5 py-2 shadow-sm shadow-accent/5 cursor-pointer hover:border-accent/35 active:scale-[0.99] transition-all text-left"
                >
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
                            style={{
                                width: (orderConfirmed.status || 'new') === 'new' ? '0%' :
                                    orderConfirmed.status === 'preparing' ? '33%' :
                                        orderConfirmed.status === 'ready' ? '66%' : '100%'
                            }}
                        />
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

                    {!isLoading && promosInView.length > 0 && (
                        <section className="mb-2 rounded-lg border border-slate-100 bg-white px-2 py-1.5 shadow-sm">
                            <div className="mb-1 flex items-center gap-1 px-0.5">
                                <Sparkles size={11} className="text-accent shrink-0" />
                                <h3 className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                                    Promotions
                                </h3>
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 no-scrollbar">
                                {promosInView.map((product) => (
                                    <PromoProductCard
                                        key={`strip-${product._id}`}
                                        product={product}
                                        cart={cart}
                                        addToCart={addToCart}
                                        removeFromCart={removeFromCart}
                                        strip
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="overflow-y-auto scroller max-h-[calc(100vh-22rem)] pr-1 pb-16 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-3">
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                            ) : (
                                sortedMenu.map(product => (
                                    <button
                                        type="button"
                                        key={product._id}
                                        onClick={() => !cart[product._id] && addToCart(product)}
                                        className={`group flex flex-col items-center rounded-xl border bg-white p-2 text-center transition-all hover:border-accent/25 hover:shadow-md active:scale-[0.98] ${
                                            cart[product._id] ? 'ring-1 ring-inset ring-accent/45 border-accent/25' : 'border-slate-100'
                                        }`}
                                    >
                                        <div className="w-full aspect-square mb-2 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50 flex items-center justify-center relative">
                                            {product.image ? (
                                                <img src={product.image} loading="lazy" alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                                            ) : (
                                                <ChefHat size={32} className="text-slate-200" />
                                            )}

                                            {product.promotion && (
                                                <span className="absolute top-3 left-3 rounded-full bg-accent text-white text-[9px] font-black uppercase tracking-[0.18em] px-2 py-1 shadow-lg shadow-accent/20">
                                                    Promo
                                                </span>
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
            </div>
        </div>
    );
};

export default QRMenu;

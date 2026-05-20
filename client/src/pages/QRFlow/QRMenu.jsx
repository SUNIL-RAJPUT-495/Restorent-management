import React, { useState, useMemo } from 'react';
import { Search, ChefHat, Plus, Minus, ArrowRight, CheckCircle, Sparkles, MapPin } from 'lucide-react';
import { useQRContext } from './QRContext';

const QRMenu = () => {
    const { menu, isLoading, cart, addToCart, removeFromCart, setStep, cartCount, cartTotal, orderConfirmed } = useQRContext();
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

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

    // Skeleton Loader for Menu Items
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
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 pb-32">
            {/* Active Order Banner */}
            {orderConfirmed && orderConfirmed.status !== 'delivered' && (
                <div 
                    onClick={() => setStep(5)}
                    className="mb-6 bg-white rounded-2xl border border-accent/20 p-4 shadow-lg shadow-accent/5 cursor-pointer hover:scale-[1.01] active:scale-95 transition-all relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-50" />
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Active Order</h3>
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        </div>
                        <div className="bg-accent/10 text-accent p-1.5 rounded-lg group-hover:bg-accent group-hover:text-white transition-colors">
                            <ArrowRight size={12} strokeWidth={3} />
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center relative z-10 px-2">
                        <div className="absolute top-3 left-4 right-4 h-0.5 bg-slate-100 -translate-y-1/2 rounded-full z-0" />
                        <div 
                            className="absolute top-3 left-4 h-0.5 bg-accent -translate-y-1/2 rounded-full z-0 transition-all duration-1000 ease-in-out"
                            style={{ 
                                width: orderConfirmed.status === 'new' ? '0%' : 
                                       orderConfirmed.status === 'preparing' ? '33%' : 
                                       orderConfirmed.status === 'ready' ? '66%' : '100%' 
                            }} 
                        />
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
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Categories */}
                <div className="lg:w-56 shrink-0 space-y-4">
                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 no-scrollbar">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-10 w-24 lg:w-full bg-slate-100 rounded-xl animate-pulse shrink-0"></div>
                            ))
                        ) : (
                            categories.map(cat => (
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
                            ))
                        )}
                    </div>
                </div>

                {/* Items Grid */}
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
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                        ) : (
                            filteredMenu.map(product => (
                                <button
                                    key={product._id}
                                    onClick={() => !cart[product._id] && addToCart(product)}
                                    className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-3 text-center transition-all hover:-translate-y-1 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 active:scale-95"
                                >
                                    <div className="w-full aspect-square mb-3 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 flex items-center justify-center relative">
                                        {product.image ? (
                                            <img src={product.image} loading="lazy" alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <ChefHat size={32} className="text-slate-200" />
                                        )}
                                        
                                        {cart[product._id] && (
                                            <div className="absolute inset-0 bg-accent/10 backdrop-blur-[2px] animate-in fade-in duration-300"></div>
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
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRMenu;

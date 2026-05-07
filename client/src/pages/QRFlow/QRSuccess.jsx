import React from 'react';
import { ChefHat, Sparkles, CheckCircle, MapPin } from 'lucide-react';
import { useQRContext } from './QRContext';
import BillReceipt from '../../components/BillReceipt';

const QRSuccess = () => {
    const { orderConfirmed, selectedTable, restaurantInfo, resetFlow, startNewOrder } = useQRContext();

    if (!orderConfirmed) return null;

    return (
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
                    <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 -translate-y-1/2 rounded-full z-0" />
                    
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
                    onClose={startNewOrder} 
                    actionType="download"
                />
            </div>
        </div>
    );
};

export default QRSuccess;

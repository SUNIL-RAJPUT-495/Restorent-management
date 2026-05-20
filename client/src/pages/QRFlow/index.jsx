import React, { useEffect } from 'react';
import { ShoppingCart, ArrowLeft, ChefHat, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRProvider, useQRContext } from './QRContext';
import QROnboarding from './QROnboarding';
import QRMenu from './QRMenu';
import QRCart from './QRCart';
import QRTable from './QRTable';
import QRPayment from './QRPayment';
import QRSuccess from './QRSuccess';
import QRFeedback from './QRFeedback';

const QRLayout = () => {
    const { step, setStep, cartCount, cartTotal, restaurantInfo, preSelectedTable } = useQRContext();

    useEffect(() => {
        if (step === 3 && preSelectedTable) {
            setStep(4);
        }
    }, [step, preSelectedTable, setStep]);

    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -20 }
    };

    const pageTransition = {
        type: "tween",
        ease: "anticipate",
        duration: 0.5
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-accent/20">
            {step === 0 && <QROnboarding />}

            {step > 0 && (
                <>
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
                                    {step === 5 ? 'Order Token' : (restaurantInfo?.restaurantName || 'Menu')}
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

                    <main>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial="initial"
                                animate="in"
                                exit="out"
                                variants={pageVariants}
                                transition={pageTransition}
                            >
                                {step === 1 && <QRMenu />}
                                {step === 2 && <QRCart />}
                                {step === 3 && <QRTable />}
                                {step === 4 && <QRPayment />}
                                {step === 5 && <QRSuccess />}
                                {step === 6 && <QRFeedback />}
                            </motion.div>
                        </AnimatePresence>

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
                </>
            )}
        </div>
    );
};

export default function QRApp() {
    return (
        <QRProvider>
            <QRLayout />
        </QRProvider>
    );
}

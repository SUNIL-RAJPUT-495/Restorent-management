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
    const { step, setStep, cartCount, cartTotal, restaurantInfo, preSelectedTable, promoModalOpen } = useQRContext();

    useEffect(() => {
        const showBar = step === 1 && cartCount > 0 && !promoModalOpen;
        // #region agent log
        fetch('http://127.0.0.1:7791/ingest/eae95dce-fe21-44c4-8d93-dcd008b62678', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'edcefc' },
            body: JSON.stringify({
                sessionId: 'edcefc',
                location: 'QRFlow/index.jsx:floating-cart',
                message: 'floating_cart_visibility',
                data: { showBar, step, cartCount, promoModalOpen },
                hypothesisId: 'H_HIDE',
                timestamp: Date.now(),
                runId: 'post-hide-with-modal',
            }),
        }).catch(() => {});
        // #endregion
    }, [step, cartCount, promoModalOpen]);

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
                        {step === 1 && cartCount > 0 && !promoModalOpen && (
                            <div
                                className="fixed left-1/2 bottom-0 z-[60] w-full max-w-xs -translate-x-1/2 px-3 pt-1"
                                style={{
                                    paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="w-full min-h-[40px] bg-accent text-white rounded-lg py-2 px-2.5 font-bold shadow-md shadow-accent/20 flex items-center justify-between gap-2 active:scale-[0.99] transition-transform"
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="relative shrink-0">
                                            <ShoppingCart size={16} strokeWidth={2.25} className="opacity-95" />
                                            <span className="absolute -top-1 -right-1 bg-white text-accent min-w-[0.875rem] h-3.5 px-0.5 rounded-full border border-accent/25 text-[6px] flex items-center justify-center font-black leading-none">{cartCount}</span>
                                        </div>
                                        <span className="text-[10px] uppercase tracking-wide font-black truncate">View cart</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-sm font-black italic tabular-nums tracking-tight">₹{cartTotal.toFixed(2)}</span>
                                        <ArrowRight size={14} strokeWidth={2.5} className="opacity-90 shrink-0" />
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

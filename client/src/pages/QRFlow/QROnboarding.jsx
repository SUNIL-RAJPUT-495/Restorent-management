import React from 'react';
import { Sparkles } from 'lucide-react';
import { useQRContext } from './QRContext';

const onboardingImage = "/onboarding.png";

const QROnboarding = () => {
    const { customerInfo, setCustomerInfo, setStep, restaurantInfo } = useQRContext();

    const handleOnboarding = (e) => {
        e.preventDefault();
        if (!customerInfo.name || !customerInfo.phone) return;
        localStorage.setItem('qr_customer_info', JSON.stringify(customerInfo));
        sessionStorage.removeItem('qr_promo_modal_seen');
        setStep(1);
    };

    const inputClass =
        'w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all outline-none font-bold text-sm';

    return (
        <div className="h-screen w-full relative flex items-center justify-center overflow-hidden animate-in fade-in duration-700">
            <div className="absolute inset-0 z-0">
                <img src={onboardingImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/55" />
            </div>

            <div className="relative z-10 w-full max-w-[360px] px-4">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-2xl shadow-black/10 space-y-6 text-center">
                    <div className="space-y-2">
                        <div className="w-10 h-10 bg-accent/15 rounded-2xl flex items-center justify-center mx-auto border border-accent/25">
                            <Sparkles className="text-accent" size={20} />
                        </div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase italic leading-snug">
                            Welcome to <br /> {restaurantInfo?.restaurantName}
                        </h1>
                    </div>

                    <form onSubmit={handleOnboarding} className="space-y-3 text-left">
                        <input
                            type="text"
                            required
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                            placeholder="Full name"
                            className={inputClass}
                        />
                        <input
                            type="tel"
                            required
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                            placeholder="Phone number"
                            className={inputClass}
                        />
                        <button
                            type="submit"
                            className="w-full mt-1 bg-accent text-white rounded-xl py-3.5 font-black text-sm uppercase tracking-widest shadow-lg shadow-accent/25 hover:opacity-95 active:scale-[0.99] transition-all"
                        >
                            Open menu
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default QROnboarding;

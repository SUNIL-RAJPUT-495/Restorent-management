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
        setStep(1);
    };

    return (
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
                        <button type="submit" className="w-full bg-accent text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-transform">
                            Open Menu
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default QROnboarding;

import React from 'react';
import { Star } from 'lucide-react';
import { useQRContext } from './QRContext';
import axios from 'axios';
import { baseURL } from '../../common/SummerAPI';
import { toast } from 'sonner';

const QRFeedback = () => {
    const { feedback, setFeedback, customerInfo, resetFlow } = useQRContext();

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
            resetFlow();
        }
    };

    return (
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

                <button
                    onClick={resetFlow}
                    className="w-full bg-slate-100 text-slate-500 rounded-2xl py-4 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 active:scale-95 transition-all mt-3 border border-slate-200/50"
                >
                    Skip & Go to Menu
                </button>
            </div>
        </div>
    );
};

export default QRFeedback;

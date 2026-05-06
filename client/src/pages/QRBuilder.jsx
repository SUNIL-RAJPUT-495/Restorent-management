import React, { useState, useEffect } from 'react';
import { QrCode, Download, Link as LinkIcon, Store, CheckCircle } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import AxiosAdmin from "@/utils/axiosAdmin";
import SummaryApi from "@/common/SummerAPI";

const QRBuilder = () => {
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getSettings.url);
      return response.data;
    },
  });

  const restaurantName = settings?.restaurantName || "Restaurant";

  useEffect(() => {
    const targetUrl = `${window.location.origin}/order`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(targetUrl)}&margin=15&format=png`;
    setQrUrl(qrImageUrl);
  }, []);

  const handleDownload = async () => {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${restaurantName}_Menu_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      window.open(qrUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/order`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="p-10 text-center font-black text-primary animate-pulse tracking-[0.2em]">GENERATING...</div>;

  return (
    <div className="p-4 md:p-10 flex items-center justify-center min-h-[80vh] animate-in fade-in duration-700">
      <div className="bg-white rounded-[40px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        
        {/* Left Side: Info & Actions */}
        <div className="p-8 md:p-12 md:w-1/2 space-y-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-50">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Store size={20} strokeWidth={3} />
                    </div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Official Menu QR</p>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
                    {restaurantName}
                </h1>
                <p className="text-slate-400 font-medium leading-relaxed">
                    This QR code is linked to your digital menu. Customers can scan it to browse, order, and pay instantly.
                </p>
            </div>

            <div className="space-y-4 pt-4">
                <div className="flex gap-4">
                    <button 
                        onClick={handleCopyLink}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${copied ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {copied ? <CheckCircle size={18} /> : <LinkIcon size={18} />}
                        {copied ? 'Copied' : 'Copy Link'}
                    </button>
                    
                    <button 
                        onClick={handleDownload}
                        className="flex-[2] bg-slate-900 text-white rounded-2xl py-4 font-black text-sm flex items-center justify-center gap-3 hover:bg-primary transition-all shadow-xl shadow-slate-200 active:scale-95"
                    >
                        <Download size={20} strokeWidth={3} />
                        Download QR
                    </button>
                </div>
                <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    High-Resolution PNG
                </p>
            </div>
        </div>

        {/* Right Side: QR Preview */}
        <div className="p-12 md:w-1/2 bg-slate-50 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
                <div className="relative p-8 bg-white rounded-[60px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-8 border-white group transition-all duration-500 hover:scale-105">
                    <img 
                        src={qrUrl} 
                        alt="QR Code" 
                        className="w-48 h-48 md:w-64 md:h-64 object-contain mix-blend-multiply" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/40 backdrop-blur-[2px] rounded-[60px]">
                        <div className="bg-primary text-white p-4 rounded-full shadow-2xl">
                            <QrCode size={32} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Scan to Preview</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default QRBuilder;

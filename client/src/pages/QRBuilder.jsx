import React, { useState, useEffect } from 'react';
import { QrCode, Download, Link as LinkIcon, Store, CheckCircle } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import AxiosAdmin from "@/utils/axiosAdmin";
import SummaryApi from "@/common/SummerAPI";

const QRBuilder = () => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery({
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

  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const response = await AxiosAdmin.get(SummaryApi.getTables.url);
      return response.data;
    },
  });

  const targetUrl = `${window.location.origin}/order${selectedTable ? `?table=${selectedTable.number}` : ''}`;

  useEffect(() => {
    if (!targetUrl) return;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(targetUrl)}&margin=15&format=png`;
    setQrUrl(qrImageUrl);
  }, [targetUrl]);

  const handleDownload = async () => {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${restaurantName}${selectedTable ? `_Table_${selectedTable.number}` : ''}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      window.open(qrUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (settingsLoading || tablesLoading) return <div className="p-10 text-center font-black text-primary animate-pulse tracking-[0.2em]">GENERATING...</div>;

  return (
    <div className="p-4 md:p-10 flex items-center justify-center min-h-[80vh] animate-in fade-in duration-700">
      <div className="bg-white rounded-[40px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        
        {/* Left Side: Info, Table Selection & Actions */}
        <div className="p-8 md:p-12 md:w-1/2 space-y-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-50">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Store size={20} strokeWidth={3} />
                    </div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Table QR Generator</p>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
                    {restaurantName}
                </h1>
                <p className="text-slate-400 font-medium leading-relaxed">
                    Select a table to generate its QR code. The selected URL will include the table number so customers land directly on that table's order page.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
                {tables.length === 0 ? (
                    <div className="col-span-1 sm:col-span-2 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                        No tables available yet.
                    </div>
                ) : (
                    tables.map((table) => {
                        const isActive = selectedTable?.number === table.number;
                        const statusColor = table.status === 'occupied' ? 'ring-destructive/30 bg-destructive/5 text-destructive' : table.status === 'reserved' ? 'ring-warning/30 bg-warning/5 text-warning' : 'ring-success/30 bg-success/5 text-success';
                        return (
                            <button
                                key={table._id || table.number}
                                onClick={() => setSelectedTable(table)}
                                className={`group rounded-3xl border ${isActive ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-slate-200 bg-white hover:border-slate-300'} p-4 text-left transition-all duration-200`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-black text-slate-900">Table {table.number}</p>
                                        <p className="text-xs text-slate-500">Seats {table.capacity || 'N/A'}</p>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${statusColor}`}>
                                        {table.status || 'free'}
                                    </span>
                                </div>
                                {isActive && (
                                    <p className="mt-3 text-xs text-primary/90 font-semibold">Selected for QR</p>
                                )}
                            </button>
                        );
                    })
                )}
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
                    {selectedTable ? `Table ${selectedTable.number} QR ready` : 'General order QR ready'}
                </p>
            </div>
        </div>

        {/* Right Side: QR Preview */}
        <div className="p-8 md:p-12 md:w-1/2 bg-slate-50 flex flex-col items-center justify-center space-y-6">
            <div className="relative w-full max-w-[420px]">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
                <div className="relative p-6 md:p-8 bg-white rounded-[60px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-8 border-white group transition-all duration-500 hover:scale-[1.02]">
                    <img 
                        src={qrUrl} 
                        alt="QR Code" 
                        className="w-full h-auto max-w-[300px] sm:max-w-[340px] md:max-w-[380px] object-contain mix-blend-multiply" 
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

import React from 'react';
import { MapPin } from 'lucide-react';
import { useQRContext } from './QRContext';

const QRTable = () => {
    const { tables, isLoading, selectedTable, setSelectedTable, setStep } = useQRContext();

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-[32px] bg-slate-100 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-32">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter text-center">Confirm Table</h2>
                <p className="text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">Where are you seated?</p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {tables.map(table => {
                    const isOccupied = table.status === 'occupied';
                    const isSelected = selectedTable === table.number;

                    return (
                        <button
                            key={table.number}
                            onClick={() => setSelectedTable(table.number)}
                            className={`relative aspect-square rounded-[32px] flex flex-col items-center justify-center gap-2 transition-all border-2 overflow-hidden ${
                                isSelected
                                    ? 'bg-accent border-accent text-white shadow-xl shadow-accent/20 scale-105 z-10'
                                    : isOccupied
                                        ? 'bg-orange-50 border-orange-100 text-orange-500 hover:border-orange-300 hover:shadow-md'
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-accent/30 hover:shadow-sm'
                                }`}
                        >
                            {isOccupied && !isSelected && (
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-400 animate-pulse shadow-[0_0_8px_rgba(251,146,60,0.6)]"></div>
                            )}
                            <MapPin size={20} className={isSelected ? 'text-white' : isOccupied ? 'text-orange-400' : 'text-slate-300'} />
                            <span className="font-black text-xl tracking-tighter">{table.number}</span>
                            {isOccupied && !isSelected && (
                                <span className="text-[8px] font-bold uppercase tracking-widest text-orange-500/80 absolute bottom-3">In Use</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {selectedTable && (
                <button
                    onClick={() => setStep(4)}
                    className="w-full bg-accent text-white rounded-[28px] py-6 font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-accent/30 mt-8"
                >
                    Confirm Table {selectedTable}
                </button>
            )}
        </div>
    );
};

export default QRTable;

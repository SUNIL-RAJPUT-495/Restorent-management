import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import * as htmlToImage from 'html-to-image';

const BillReceipt = ({ billData, settings, onClose, onPrint, actionType = 'print' }) => {
  const receiptRef = useRef(null);
  if (!billData || !billData.activeOrder) return null;

  const items = billData.activeOrder.items || [];
  const subtotal = items.reduce((s, i) => s + (i.price * i.qty), 0);
  const cgstRate = (settings?.cgst ?? 2.5) / 100;
  const sgstRate = (settings?.sgst ?? 2.5) / 100;
  const cgst = subtotal * cgstRate;
  const sgst = subtotal * sgstRate;
  const grandTotal = subtotal + cgst + sgst;
  const totalQty = items.reduce((s, i) => s + (i.qty || 1), 0);

  const handleAction = async () => {
    if (actionType === 'download') {
      if (!receiptRef.current) return;
      try {
        const dataUrl = await htmlToImage.toPng(receiptRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `Receipt_${billData.activeOrder.orderNumber || Date.now()}.png`;
        link.click();
      } catch (err) {
        console.error("Failed to download receipt", err);
      }
    } else {
      if (onPrint) {
        onPrint();
      } else {
        window.print();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900 w-full max-w-sm mx-auto overflow-hidden">
      {/* Scrollable Container */}
      <div 
        className="overflow-y-auto flex-1 bg-white custom-scrollbar-hide"
        style={{ 
          maxHeight: '75vh',
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style>
          {`
            .custom-scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            @media print {
              .custom-scrollbar-hide {
                overflow: visible !important;
                max-height: none !important;
              }
            }
          `}
        </style>
        {/* Receipt Body — to capture */}
        <div ref={receiptRef} className="font-mono text-xs p-4 print:p-0 bg-white min-h-max w-full">
          {/* Header */}
          <div className="text-center py-3 border-b border-dashed border-slate-300">
            <p className="text-base font-bold uppercase tracking-widest">{settings?.restaurantName || "Restaurant"}</p>
            {settings?.gstNo && <p className="mt-0.5 text-slate-500">GSTIN: {settings.gstNo}</p>}
            {settings?.fssaiNo && <p className="text-slate-500">FSSAI: {settings.fssaiNo}</p>}
            {settings?.location && <p className="text-slate-500">{settings.location}</p>}
            {settings?.phone && <p className="text-slate-500">Mob: {settings.phone}</p>}
          </div>

          {/* Bill Meta */}
          <div className="py-2 border-b border-dashed border-slate-300 space-y-0.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Bill No:</span>
            <span>#{billData.activeOrder.orderNumber?.slice(-6) || '0000'}</span>
          </div>
          {billData.tableNumber && (
            <div className="flex justify-between">
              <span className="text-slate-500">Table:</span>
              <span>{String(billData.tableNumber).padStart(2, '0')}</span>
            </div>
          )}
          {(billData.guests || billData.activeOrder.guests) && (
            <div className="flex justify-between">
              <span className="text-slate-500">Guests:</span>
              <span>{billData.guests || billData.activeOrder.guests}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Payment:</span>
            <span className="font-bold uppercase">
              {billData.activeOrder.paymentMethod === 'online' ? 'ONLINE' : 'CASH'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date:</span>
            <span>{new Date(billData.activeOrder.createdAt || new Date()).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-2 border-b border-dashed border-slate-300">
          <div className="flex justify-between font-bold border-b border-slate-200 pb-1 mb-1">
            <span className="w-5">#</span>
            <span className="flex-1">Item</span>
            <span className="w-8 text-center">Qty</span>
            <span className="w-16 text-right">Amt</span>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between py-0.5">
              <span className="w-5 text-slate-500">{idx + 1}</span>
              <span className="flex-1 truncate pr-1">{item.name}</span>
              <span className="w-8 text-center">{item.qty || 1}</span>
              <span className="w-16 text-right">₹{((item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="py-2 border-b border-dashed border-slate-300 space-y-0.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Qty</span>
            <span>{totalQty}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">CGST ({settings?.cgst ?? 2.5}%)</span>
            <span>₹{cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">SGST ({settings?.sgst ?? 2.5}%)</span>
            <span>₹{sgst.toFixed(2)}</span>
          </div>
        </div>

          {/* Grand Total */}
          <div className="py-3 text-center">
            <div className="flex justify-between text-sm font-bold text-slate-900 border-t-2 border-slate-800 pt-2">
              <span>GRAND TOTAL</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
            <p className="mt-3 text-[10px] text-slate-500 italic">"Good food, good times. Thanks for choosing us!"</p>
          </div>
        </div>
      </div>

      {/* Action Buttons (Hidden on Print) */}
      <div className="p-4 pt-3 border-t border-slate-100 flex gap-2 print:hidden bg-slate-50">
        {onClose && (
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        )}
        <Button className="bg-slate-900 text-white flex-1 hover:bg-slate-800" onClick={handleAction}>
          {actionType === 'download' ? 'Download Receipt' : 'Print Receipt'}
        </Button>
      </div>
    </div>
  );
};

export default BillReceipt;

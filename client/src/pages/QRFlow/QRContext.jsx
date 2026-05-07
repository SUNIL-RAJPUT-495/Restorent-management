import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { baseURL } from '../../common/SummerAPI';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const QRContext = createContext();

export const useQRContext = () => useContext(QRContext);

export const QRProvider = ({ children }) => {
    const [searchParams] = useSearchParams();
    const preSelectedTable = searchParams.get('table');
    const { orderNumber: urlOrderNumber } = useParams();

    const [step, setStep] = useState(() => {
        const savedStep = localStorage.getItem('qr_current_step');
        return savedStep ? parseInt(savedStep) : 0;
    });

    useEffect(() => {
        localStorage.setItem('qr_current_step', step.toString());
    }, [step]);

    const [customerInfo, setCustomerInfo] = useState(() => {
        const saved = localStorage.getItem('qr_customer_info');
        return saved ? JSON.parse(saved) : { name: '', phone: '', email: '' };
    });

    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('qr_cart_data');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('qr_cart_data', JSON.stringify(cart));
    }, [cart]);

    const [selectedTable, setSelectedTable] = useState(preSelectedTable || null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [orderConfirmed, setOrderConfirmed] = useState(() => {
        const saved = localStorage.getItem('qr_last_order');
        return saved ? JSON.parse(saved) : null;
    });
    const [feedback, setFeedback] = useState({ rating: 0, comment: '' });

    // React Query for API Data
    const { data: menu = [], isLoading: isMenuLoading } = useQuery({
        queryKey: ['publicMenu'],
        queryFn: async () => {
            const res = await axios.get(`${baseURL}/api/public/menu`);
            return Array.isArray(res.data) ? res.data : (res.data?.items || []);
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: tables = [], isLoading: isTablesLoading } = useQuery({
        queryKey: ['publicTables'],
        queryFn: async () => {
            const res = await axios.get(`${baseURL}/api/public/tables`);
            return Array.isArray(res.data) ? res.data : [];
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: restaurantInfo = { restaurantName: "Restaurant" }, isLoading: isInfoLoading } = useQuery({
        queryKey: ['publicInfo'],
        queryFn: async () => {
            try {
                const res = await axios.get(`${baseURL}/api/public/info`);
                return res.data;
            } catch {
                return { restaurantName: "Restaurant" };
            }
        },
        staleTime: 10 * 60 * 1000,
    });

    const [isVerifying, setIsVerifying] = useState(false);

    // Initial Payment Verification
    useEffect(() => {
        const verifyPayment = async () => {
            if (urlOrderNumber && step !== 5) {
                setIsVerifying(true);
                const vToastId = toast.loading("Verifying payment...");
                try {
                    const verifyRes = await axios.post(`${baseURL}/api/public/payment/imb/verify`, { orderNumber: urlOrderNumber });
                    if (verifyRes.data.success && verifyRes.data.order) {
                        setOrderConfirmed(verifyRes.data.order);
                        setStep(5);
                        toast.success("Payment Verified!", { id: vToastId });
                    } else if (verifyRes.data.status === 'pending') {
                        toast.loading("Payment is still processing...", { id: vToastId });
                    } else {
                        toast.error("Payment verification failed", { id: vToastId });
                    }
                } catch (err) {
                    console.error("Verification failed:", err);
                    toast.error("Verification failed", { id: vToastId });
                } finally {
                    setIsVerifying(false);
                }
            }
        };
        verifyPayment();
    }, [urlOrderNumber]);

    // Skip onboarding if already done
    useEffect(() => {
        if (!localStorage.getItem('qr_current_step') && customerInfo.name && customerInfo.phone && !urlOrderNumber) {
            setStep(1);
        }
    }, [customerInfo.name, customerInfo.phone, urlOrderNumber]);

    // Socket Connection for Real-time Tracking
    useEffect(() => {
        if (step === 5 || (step === 1 && orderConfirmed && orderConfirmed.status !== 'delivered')) {
            const socket = io(baseURL);
            
            socket.on('connect', () => console.log('QR Flow Connected to WebSocket'));
            
            socket.on('orderUpdated', (updatedOrder) => {
                setOrderConfirmed((prev) => {
                    if (prev && prev.orderNumber === updatedOrder.orderNumber) {
                        localStorage.setItem('qr_last_order', JSON.stringify(updatedOrder));
                        if (updatedOrder.status === 'delivered') {
                            setTimeout(() => setStep(6), 2000);
                        }
                        return updatedOrder;
                    }
                    return prev;
                });
            });

            return () => socket.disconnect();
        }
    }, [step]);

    // Cart Operations
    const addToCart = (product) => {
        setCart(prev => ({
            ...prev,
            [product._id]: { product, qty: (prev[product._id]?.qty || 0) + 1 }
        }));
    };

    const removeFromCart = (productId) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[productId]?.qty > 1) {
                newCart[productId].qty -= 1;
            } else {
                delete newCart[productId];
            }
            return newCart;
        });
    };

    const cartItems = Object.values(cart);
    const cartSubtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

    const cgstAmount = (cartSubtotal * (restaurantInfo?.cgst || 0)) / 100;
    const sgstAmount = (cartSubtotal * (restaurantInfo?.sgst || 0)) / 100;
    const cartTotal = cartSubtotal + cgstAmount + sgstAmount;

    const resetFlow = () => {
        setCart({});
        setOrderConfirmed(null);
        localStorage.removeItem('qr_cart_data');
        localStorage.removeItem('qr_current_step');
        localStorage.removeItem('qr_last_order');
        setFeedback({ rating: 0, comment: '' });
        setStep(0);  // Go back to onboarding so new customer can start fresh
    };

    const startNewOrder = () => {
        setCart({});
        localStorage.removeItem('qr_cart_data');
        setStep(1); // Go back to menu, preserving orderConfirmed
    };

    const isLoading = isMenuLoading || isTablesLoading || isInfoLoading || isVerifying;

    return (
        <QRContext.Provider value={{
            step, setStep,
            customerInfo, setCustomerInfo,
            menu, tables, restaurantInfo, isLoading,
            cart, addToCart, removeFromCart, cartItems, cartCount, cartTotal, cartSubtotal, cgstAmount, sgstAmount,
            selectedTable, setSelectedTable, preSelectedTable,
            paymentMethod, setPaymentMethod,
            orderConfirmed, setOrderConfirmed,
            feedback, setFeedback,
            resetFlow, startNewOrder
        }}>
            {children}
        </QRContext.Provider>
    );
};

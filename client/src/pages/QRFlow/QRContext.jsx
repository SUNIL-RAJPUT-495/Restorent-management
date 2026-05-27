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
    const [promoModalOpen, setPromoModalOpen] = useState(false);

    const clearOrderFlow = () => {
        setCart({});
        setOrderConfirmed(null);
        setSelectedTable(null);
        setFeedback({ rating: 0, comment: '' });
        setPromoModalOpen(false);
        setStep(0);
        localStorage.removeItem('qr_cart_data');
        localStorage.removeItem('qr_last_order');
        localStorage.removeItem('qr_current_step');
    };

    // React Query for API Data
    const { data: rawMenu = [], isLoading: isMenuLoading } = useQuery({
        queryKey: ['publicMenu'],
        queryFn: async () => {
            const res = await axios.get(`${baseURL}/api/public/menu`);
            return Array.isArray(res.data) ? res.data : (res.data?.items || []);
        },
        staleTime: 1000,
    });

    const { data: promotions = [], isLoading: isPromotionsLoading } = useQuery({
        queryKey: ['publicPromotions'],
        queryFn: async () => {
            const res = await axios.get(`${baseURL}/api/public/promotions`);
            return Array.isArray(res.data) ? res.data : [];
        },
        staleTime: 1000,
    });

    // Automatically parse promotion titles to apply FLAT % or flat amount discounts to linked items
    const menu = useMemo(() => {
        if (!rawMenu || rawMenu.length === 0) return [];
        return rawMenu.map(product => {
            if (!promotions || promotions.length === 0) return product;

            // Find if there is an active promotion linking to this product
            const promo = promotions.find(p => {
                if (p.active === false) return false;
                if (!p.productId) return false;

                const promoProdId = typeof p.productId === 'object'
                    ? (p.productId._id || p.productId.id)
                    : p.productId;

                const currentProdId = product._id || product.id;

                return promoProdId && currentProdId && promoProdId.toString().trim() === currentProdId.toString().trim();
            });

            if (!promo || !promo.title) return product;

            // 1. Parse percentage discount (e.g., "50% OFF", "FLAT 50%", "66%")
            const percentMatch = promo.title.toString().match(/(\d+)\s*%/);
            if (percentMatch) {
                const percent = parseInt(percentMatch[1], 10);
                if (percent > 0 && percent <= 100) {
                    const originalPrice = product.originalPrice || product.price;
                    const discountedPrice = Math.round(originalPrice * (1 - percent / 100));
                    return {
                        ...product,
                        price: discountedPrice,
                        originalPrice: originalPrice
                    };
                }
            }

            // 2. Parse flat amount discount (e.g., "₹50 OFF", "50 OFF", "Rs 50", "100 rs")
            const flatMatch = promo.title.toString().match(/(?:₹|Rs\.?|INR)\s*(\d+)/i) || promo.title.toString().match(/(\d+)\s*(?:off|rupees|rs)/i);
            if (flatMatch) {
                const flatAmount = parseInt(flatMatch[1], 10);
                if (flatAmount > 0 && flatAmount < product.price) {
                    const originalPrice = product.originalPrice || product.price;
                    const discountedPrice = Math.max(0, originalPrice - flatAmount);
                    return {
                        ...product,
                        price: discountedPrice,
                        originalPrice: originalPrice
                    };
                }
            }

            // 3. Fallback: Parse plain numbers (e.g., "20", "50", "150")
            const plainNumberMatch = promo.title.toString().trim().match(/^(\d+)$/);
            if (plainNumberMatch) {
                const value = parseInt(plainNumberMatch[1], 10);
                if (value > 0) {
                    const originalPrice = product.originalPrice || product.price;
                    // If the value is <= 100, treat it as percentage discount. Otherwise, treat as flat amount.
                    if (value <= 100) {
                        const discountedPrice = Math.round(originalPrice * (1 - value / 100));
                        return {
                            ...product,
                            price: discountedPrice,
                            originalPrice: originalPrice
                        };
                    } else if (value < product.price) {
                        const discountedPrice = Math.max(0, originalPrice - value);
                        return {
                            ...product,
                            price: discountedPrice,
                            originalPrice: originalPrice
                        };
                    }
                }
            }

            return product;
        });
    }, [rawMenu, promotions]);

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

    const cartItems = useMemo(() => {
        return Object.values(cart).map(item => {
            const latestProduct = menu.find(p => (p._id || p.id)?.toString().trim() === (item.product._id || item.product.id)?.toString().trim());
            return {
                ...item,
                product: latestProduct || item.product
            };
        });
    }, [cart, menu]);
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
        setStep(1);  // Go back to menu so they don't have to login again
    };

    const startNewOrder = () => {
        setCart({});
        localStorage.removeItem('qr_cart_data');
        setStep(1); // Go back to menu, preserving orderConfirmed
    };

    const isLoading = isMenuLoading || isTablesLoading || isInfoLoading || isVerifying || isPromotionsLoading;

    return (
        <QRContext.Provider value={{
            step, setStep,
            customerInfo, setCustomerInfo,
            menu, tables, restaurantInfo, promotions, isLoading,
            cart, addToCart, removeFromCart, cartItems, cartCount, cartTotal, cartSubtotal, cgstAmount, sgstAmount,
            selectedTable, setSelectedTable, preSelectedTable,
            paymentMethod, setPaymentMethod,
            orderConfirmed, setOrderConfirmed,
            feedback, setFeedback,
            promoModalOpen, setPromoModalOpen,
            resetFlow, startNewOrder
        }}>
            {children}
        </QRContext.Provider>
    );
};

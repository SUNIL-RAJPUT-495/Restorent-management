export const baseURL = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'))
    ? "http://localhost:5000"
    : "https://backend.bhukhabhukhi.com";

const SummaryApi = {
   //app

    // Restaurant Auth & Subscription
    adminLogin: { url: baseURL + "/api/admin/login", method: "post" },
    purchasePlan: { url: baseURL + "/api/admin/purchase-plan", method: "post" },
    getMe: { url: baseURL + "/api/admin/me", method: "get" },
    checkPlanAccess: { url: baseURL + "/api/admin/plan-access-check", method: "get" },

    // Menu / Products
    getProducts:    { url: baseURL + "/api/products",        method: "get"  },
    addProduct:     { url: baseURL + "/api/products/add",   method: "post" },
    updateProduct: (id) => ({ url: baseURL + `/api/products/${id}`, method: "put" }),
    deleteProduct: (id) => ({ url: baseURL + `/api/products/${id}`, method: "delete" }),

    // Orders
    createOrder:    { url: baseURL + "/api/orders",         method: "post" },
    getOrders:      { url: baseURL + "/api/orders",         method: "get"  },
    updateOrderStatus: (id) => ({ url: baseURL + `/api/orders/${id}`, method: "put" }),

    // Tables
    getTables:      { url: baseURL + "/api/tables",         method: "get"  },
    addTable:       { url: baseURL + "/api/tables",         method: "post" },
    updateTable: (number) => ({ url: baseURL + `/api/tables/${number}`, method: "put" }),
    deleteTable: (number) => ({ url: baseURL + `/api/tables/${number}`, method: "delete" }),
    
    // Ingredients
    getIngredients: { url: baseURL + "/api/ingredients", method: "get" },
    addIngredient:  { url: baseURL + "/api/ingredients/add", method: "post" },
    updateIngredient: (id) => ({ url: baseURL + `/api/ingredients/${id}`, method: "put" }),
    deleteIngredient: (id) => ({ url: baseURL + `/api/ingredients/${id}`, method: "delete" }),

    // Categories
    getCategories:  { url: baseURL + "/api/categories", method: "get" },
    addCategory:     { url: baseURL + "/api/categories/add", method: "post" },
    deleteCategory:  (id) => ({ url: baseURL + `/api/categories/${id}`, method: "delete" }),

    // Settings
    getSettings:    { url: baseURL + "/api/settings", method: "get" },
    updateSettings: { url: baseURL + "/api/settings", method: "put" },
    
    // Public Feedback
    submitFeedback: { url: baseURL + "/api/public/feedback", method: "post" },

    // Promotion Banners
    getPromotions:       { url: baseURL + "/api/promotions",        method: "get"  },
    addPromotion:        { url: baseURL + "/api/promotions/add",   method: "post" },
    updatePromotion:     (id) => ({ url: baseURL + `/api/promotions/${id}`, method: "put" }),
    deletePromotion:     (id) => ({ url: baseURL + `/api/promotions/${id}`, method: "delete" }),
    getActivePromotions: { url: baseURL + "/api/public/promotions",  method: "get"  }
}


export default SummaryApi

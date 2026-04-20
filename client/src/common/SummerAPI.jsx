export const baseURL = import.meta.env.VITE_API_URL || "https://restorent-management-g7de.vercel.app";

const SummaryApi = {
    // Admin & Auth
    adminLogin: { url: baseURL + "/api/admin/login", method: "post" },
    adminSeed:  { url: baseURL + "/api/admin/seed",  method: "post" },
    getProfile: { url: baseURL + "/api/admin/profile", method: "get" },
    updateProfile: { url: baseURL + "/api/admin/profile", method: "put" },
    changePassword: { url: baseURL + "/api/admin/change-password", method: "put" },

    // Staff Management
    getStaff: { url: baseURL + "/api/admin/staff", method: "get" },
    registerStaff: { url: baseURL + "/api/admin/register-staff", method: "post" },

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
}

export default SummaryApi

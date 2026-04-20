import React from 'react'
import { Navigate } from 'react-router-dom'

/**
 * ProtectedAdminRoute — Admin routes ko protect karta hai.
 * Agar valid token nahi mila localStorage mein toh login page pe redirect kar dega.
 */
export const ProtectedAdminRoute = ({ children }) => {
    const token = localStorage.getItem("rw_admin_sec_tkn")
    
    if (!token) {
        return <Navigate to="/admin/login" replace />
    }

    return children
}

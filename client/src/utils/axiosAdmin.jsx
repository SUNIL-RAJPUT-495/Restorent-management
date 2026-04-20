import axios from "axios";
import { baseURL } from "../common/SummerAPI";

/** Sirf admin dashboard — secure token key use ho rahi hai, user tokens se mix nahi hogi */
const AxiosAdmin = axios.create({
    baseURL: baseURL,
    withCredentials: false
});

AxiosAdmin.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("rw_admin_sec_tkn");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

AxiosAdmin.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("rw_admin_sec_tkn");
            localStorage.removeItem("rw_admin_info");
            window.dispatchEvent(new CustomEvent("on-unauthorized-admin"));
        }
        return Promise.reject(error);
    }
);

export default AxiosAdmin;

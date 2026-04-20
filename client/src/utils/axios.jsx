import axios from "axios";
import { baseURL } from "../common/SummerAPI";

const Axios = axios.create({
    baseURL: baseURL,
    withCredentials: false
});

Axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

Axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_data");
            window.dispatchEvent(new CustomEvent("on-unauthorized"));
        }
        return Promise.reject(error);
    }
);

export default Axios;
import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
});

// -------------------------
// Token Refresh Queue (prevents concurrent 401 race condition)
// -------------------------
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// -------------------------
// Request Interceptor
// -------------------------

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// -------------------------
// Response Interceptor
// -------------------------

API.interceptors.response.use(

    // Agar response successful hai
    (response) => response,

    // Agar error aaya
    async (error) => {

        const originalRequest = error.config;

        // Agar Access Token expire hua
        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return API(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {

                const refresh = localStorage.getItem('refresh_token');
                const refreshUrl = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/auth/token/refresh/`;

                const response = await axios.post(
                    refreshUrl,
                    {
                        refresh: refresh,
                    }
                );

                const newAccess = response.data.access;

                localStorage.setItem(
                    'access_token',
                    newAccess
                );

                originalRequest.headers.Authorization =
                    `Bearer ${newAccess}`;

                processQueue(null, newAccess);

                // Original request dobara bhejo
                return API(originalRequest);

            } catch (refreshError) {

                processQueue(refreshError, null);

                // Refresh bhi fail
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');

                window.location.href = '/login';

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default API;
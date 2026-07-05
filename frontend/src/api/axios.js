import axios from 'axios';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
});

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

            originalRequest._retry = true;

            try {

                const refresh = localStorage.getItem('refresh_token');

                const response = await axios.post(
                    'http://127.0.0.1:8000/api/auth/token/refresh/',
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

                // Original request dobara bhejo
                return API(originalRequest);

            } catch (refreshError) {

                // Refresh bhi fail
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');

                window.location.href = '/login';

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default API;
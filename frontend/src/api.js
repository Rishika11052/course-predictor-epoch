// frontend/src/api.js
import axios from 'axios';

// Create an Axios instance pointing to your Go backend
const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Attach the JWT token to every request automatically
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('cp_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
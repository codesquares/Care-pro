import axios from 'axios';
import * as authService from './auth';
import { preserveUserJourney } from './sessionRestoration';
import config from '../config';

// Create an Axios instance with environment-aware base URL
const api = axios.create({
    baseURL: config.BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Add timeout to prevent hanging requests
    timeout: 10000
});

// Request Interceptor (Attach Token to Every Request)
api.interceptors.request.use(
    (config) => {
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('Failed to attach token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Enhanced Response Interceptor with session preservation
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
            // Preserve user journey before logout
            try {
                // Use global extractFormData if available, otherwise use imported one
                let formData = {};
                if (typeof global !== 'undefined' && typeof global.extractFormData === 'function') {
                    formData = global.extractFormData();
                } else if (typeof window !== 'undefined' && typeof window.extractFormData === 'function') {
                    formData = window.extractFormData();
                }
                
                preserveUserJourney.save(window.location.pathname, {
                    formData,
                    scrollPosition: window.scrollY || 0
                });
            } catch (preserveError) {
                console.warn('Failed to preserve journey:', preserveError);
            }

            // Attempt token refresh if not already retried
            if (!originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const newToken = await authService.refreshToken();
                    localStorage.setItem('authToken', newToken);
                    api.defaults.headers.Authorization = `Bearer ${newToken}`;
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    authService.logout();
                    return Promise.reject(error); // Return original 401 error, not refresh error
                }
            } else {
                authService.logout();
                return Promise.reject(error);
            }
        }

        // Handle server errors (5xx)
        if (error.response?.status >= 500) {
            try {
                if (typeof showNotification === 'function') {
                    showNotification('Server error. Please try again.', 'error');
                }
            } catch (notificationError) {
                console.warn('Failed to show notification:', notificationError);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Setup enhanced interceptors with custom configuration
 * @param {Object} config - Configuration options
 */
export const setupEnhancedInterceptors = (config = {}) => {
    const {
        preserveSession = true,
        showErrorNotifications = true,
        retryEnabled = true
    } = config;

    // Remove existing interceptors
    api.interceptors.response.clear();

    // Add enhanced interceptor
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // Handle 401 Unauthorized errors
            if (error.response?.status === 401) {
                if (preserveSession) {
                    // Preserve user journey before logout
                    try {
                        // Use global extractFormData if available, otherwise use imported one
                        let formData = {};
                        if (typeof global !== 'undefined' && typeof global.extractFormData === 'function') {
                            formData = global.extractFormData();
                        } else if (typeof window !== 'undefined' && typeof window.extractFormData === 'function') {
                            formData = window.extractFormData();
                        }
                        
                        preserveUserJourney.save(window.location.pathname, {
                            formData,
                            scrollPosition: window.scrollY || 0
                        });
                    } catch (preserveError) {
                        console.warn('Failed to preserve journey:', preserveError);
                    }
                }

                if (retryEnabled && !originalRequest._retry) {
                    // Attempt token refresh
                    originalRequest._retry = true;
                    try {
                        const newToken = await authService.refreshToken();
                        localStorage.setItem('authToken', newToken);
                        api.defaults.headers.Authorization = `Bearer ${newToken}`;
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    } catch (refreshError) {
                        authService.logout();
                        return Promise.reject(error); // Return original 401 error, not refresh error
                    }
                } else {
                    authService.logout();
                }
            }

            // Handle server errors (5xx)
            if (showErrorNotifications && error.response?.status >= 500) {
                try {
                    if (typeof showNotification === 'function') {
                        showNotification('Server error. Please try again.', 'error');
                    }
                } catch (notificationError) {
                    console.warn('Failed to show notification:', notificationError);
                }
            }

            return Promise.reject(error);
        }
    );
};

export default api;

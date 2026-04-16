import axios from 'axios';
import * as authService from './auth';
import { preserveUserJourney } from './sessionRestoration';
import config from '../config';

// --- Refresh token mutex ---
// Ensures only one refresh request runs at a time; all concurrent 401s wait on the same promise.
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken) {
    refreshSubscribers.forEach(cb => cb(newToken));
    refreshSubscribers = [];
}

function onTokenRefreshFailed(err) {
    refreshSubscribers.forEach(cb => cb(null, err));
    refreshSubscribers = [];
}

/**
 * Dispatch a custom event so AuthContext can react to interceptor-driven logouts
 * without the interceptor needing a direct reference to React state setters.
 */
function dispatchAuthLogout() {
    authService.logout();
    window.dispatchEvent(new Event('auth-logout'));
}

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
            // Public endpoints that don't require authentication
            const publicEndpoints = [
                '/CareGivers/AddCaregiverUser',
                '/CareGivers/AllCaregivers',
                '/Clients/AddClientUser',
                '/Admins',
                '/Authentications/CheckEmailExists',
                '/Authentications/Login',
                '/Authentications/GoogleLogin',
                '/Authentications/ForgotPassword',
                '/Authentications/ResetPassword',
                '/Authentications/VerifyEmail',
                '/Gigs',
            ];

            const isPublic = publicEndpoints.some(ep => config.url?.includes(ep));

            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            } else if (!isPublic) {
                // Cancel non-public requests if no token — avoids futile 401s
                const controller = new AbortController();
                controller.abort();
                config.signal = controller.signal;
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

            // If already retried this specific request, give up
            if (originalRequest._retry) {
                dispatchAuthLogout();
                return Promise.reject(error);
            }
            originalRequest._retry = true;

            // If a refresh is already in progress, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh((newToken, err) => {
                        if (err || !newToken) {
                            return reject(error);
                        }
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            // First 401 to arrive — take the lock and refresh
            isRefreshing = true;
            try {
                const newToken = await authService.refreshToken();
                api.defaults.headers.Authorization = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                onTokenRefreshed(newToken);
                return api(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                onTokenRefreshFailed(refreshError);
                dispatchAuthLogout();
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
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
                    originalRequest._retry = true;

                    // Use the shared mutex for concurrent 401s
                    if (isRefreshing) {
                        return new Promise((resolve, reject) => {
                            subscribeTokenRefresh((newToken, err) => {
                                if (err || !newToken) {
                                    return reject(error);
                                }
                                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                resolve(api(originalRequest));
                            });
                        });
                    }

                    isRefreshing = true;
                    try {
                        const newToken = await authService.refreshToken();
                        api.defaults.headers.Authorization = `Bearer ${newToken}`;
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        onTokenRefreshed(newToken);
                        return api(originalRequest);
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        onTokenRefreshFailed(refreshError);
                        dispatchAuthLogout();
                        return Promise.reject(error);
                    } finally {
                        isRefreshing = false;
                    }
                } else {
                    dispatchAuthLogout();
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

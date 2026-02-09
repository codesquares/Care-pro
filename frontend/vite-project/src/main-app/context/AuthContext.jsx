import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { refreshToken, logout as authServiceLogout } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [isFirstLogin, setIsFirstLogin] = useState(false);
    const navigate = useNavigate();

    // Data cleanup categories
    const DATA_CATEGORIES = {
        auth: ['authToken', 'refreshToken', 'userDetails', 'userId', 'isFirstLogin'],
        session: ['preservedSession', 'verificationStatus'],
        business: ['orderData', 'gigId', 'amount', 'careNeeds'],
        cache: ['cachedAssessments', 'assessmentQuestions']
    };

    // Centralized logout function
    const handleLogout = useCallback(() => {
        try {
            // Clear all authentication data
            DATA_CATEGORIES.auth.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Clear application-specific data
            DATA_CATEGORIES.business.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Clear session data
            DATA_CATEGORIES.session.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Reset authentication state
            setUser(null);
            setIsAuthenticated(false);
            setUserRole(null);
            setIsFirstLogin(false);
            
            // Trigger cross-tab logout communication
            try {
                window.postMessage({ type: 'LOGOUT' }, window.location.origin);
            } catch (error) {
                console.warn('Cross-tab communication failed:', error);
            }
            
            // Call auth service logout
            authServiceLogout();
            
            // Navigate to login with preservation of intended destination
            const currentPath = window.location.pathname;
            navigate('/login', { 
                state: { from: currentPath },
                replace: true 
            });
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback: still try to clear state and navigate
            setUser(null);
            setIsAuthenticated(false);
            setUserRole(null);
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    // Cross-tab communication handling
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'authToken' && !e.newValue) {
                // Token removed in another tab
                setIsAuthenticated(false);
                setUser(null);
                setUserRole(null);
                navigate('/login', { replace: true });
            } else if (e.key === 'userDetails') {
                if (!e.newValue) {
                    // User details removed in another tab
                    setIsAuthenticated(false);
                    setUser(null);
                    setUserRole(null);
                    navigate('/login', { replace: true });
                } else {
                    // User details updated in another tab
                    try {
                        const newUserData = JSON.parse(e.newValue);
                        setUser(newUserData);
                        setUserRole(newUserData.role);
                        setIsAuthenticated(true);
                    } catch (error) {
                        console.error('Error parsing updated user data:', error);
                        handleLogout();
                    }
                }
            }
        };
        
        const handleMessage = (e) => {
            if (e.data && e.data.type === 'LOGOUT' && e.origin === window.location.origin) {
                // Logout triggered from another tab
                setIsAuthenticated(false);
                setUser(null);
                setUserRole(null);
                navigate('/login', { replace: true });
            } else if (e.data && e.data.type === 'USER_UPDATE' && e.origin === window.location.origin) {
                // User update from another tab
                const userData = e.data.userData;
                if (userData) {
                    setUser(userData);
                    setUserRole(userData.role);
                    setIsAuthenticated(true);
                }
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('message', handleMessage);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('message', handleMessage);
        };
    }, [navigate, handleLogout]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (token) {
                    // Get user details from localStorage
                    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
                    const firstLogin = JSON.parse(localStorage.getItem('isFirstLogin') || 'false');
                    if (userDetails && userDetails.role) {
                        setUser(userDetails);
                        setUserRole(userDetails.role);
                        setIsAuthenticated(true);
                        setIsFirstLogin(firstLogin);
                    } else {
                        setIsAuthenticated(false);
                    }
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                handleLogout();
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [handleLogout]);

    const login = (userData, token, refreshTokenValue, firstLogin = false) => {
        try {
            localStorage.setItem('authToken', token);
            localStorage.setItem('refreshToken', refreshTokenValue);
            localStorage.setItem('userDetails', JSON.stringify(userData));
            localStorage.setItem('isFirstLogin', JSON.stringify(firstLogin));
            setUser(userData);
            setUserRole(userData.role);
            setIsAuthenticated(true);
            setIsFirstLogin(firstLogin);
            
            // Broadcast user update to other tabs
            try {
                window.postMessage({ 
                    type: 'USER_UPDATE', 
                    userData: userData 
                }, window.location.origin);
            } catch (error) {
                console.warn('Cross-tab communication failed:', error);
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    // Clear the first login flag after showing welcome modal
    const clearFirstLogin = () => {
        setIsFirstLogin(false);
        localStorage.setItem('isFirstLogin', 'false');
    };

    const updateUser = (updates) => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('userDetails') || '{}');
            const updatedUser = { ...currentUser, ...updates };
            
            localStorage.setItem('userDetails', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            // Broadcast user update to other tabs
            try {
                window.postMessage({ 
                    type: 'USER_UPDATE', 
                    userData: updatedUser 
                }, window.location.origin);
            } catch (error) {
                console.warn('Cross-tab communication failed:', error);
            }
        } catch (error) {
            console.error('Update user error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isAuthenticated, 
            login, 
            updateUser,
            handleLogout,
            loading,
            userRole,
            isAdmin: userRole === 'Admin' || userRole === 'SuperAdmin',
            isSuperAdmin: userRole === 'SuperAdmin',
            isFirstLogin,
            clearFirstLogin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom Hook for Consuming AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
};

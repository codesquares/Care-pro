import React, { createContext, useContext, useState, useEffect } from 'react';
import { refreshToken, logout } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (token) {
                    // Get user details from localStorage
                    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
                    if (userDetails && userDetails.role) {
                        setUser(userDetails);
                        setUserRole(userDetails.role);
                        setIsAuthenticated(true);
                    } else {
                        setIsAuthenticated(false);
                    }
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (userData, token, refreshTokenValue) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('refreshToken', refreshTokenValue);
        localStorage.setItem('userDetails', JSON.stringify(userData));
        setUser(userData);
        setUserRole(userData.role);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        logout();
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isAuthenticated, 
            login, 
            handleLogout, 
            loading,
            userRole,
            isAdmin: userRole === 'Admin' || userRole === 'SuperAdmin',
            isSuperAdmin: userRole === 'SuperAdmin'
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom Hook for Consuming AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
};

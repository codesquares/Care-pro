import React, { createContext, useContext, useState, useEffect } from 'react';
import { refreshToken, logout } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (token) {
                    setIsAuthenticated(true);
                    // Optionally fetch user data here
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
        setUser(userData);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, handleLogout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom Hook for Consuming AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
};

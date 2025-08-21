import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';

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
                        // Don't call logout aggressively - just set as unauthenticated
                        setIsAuthenticated(false);
                    }
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                // Don't call logout on every error - just set as unauthenticated
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (userData, token, refreshTokenValue) => {
        localStorage.setItem('authToken', token);
        if (refreshTokenValue) {
            localStorage.setItem('refreshToken', refreshTokenValue);
        }
        localStorage.setItem('userDetails', JSON.stringify(userData));
        localStorage.setItem('userId', userData.id);
        setUser(userData);
        setUserRole(userData.role);
        setIsAuthenticated(true);
        
        // No longer return navigation info - let components handle their own navigation
    };

    const handleLogout = () => {
        logout();
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
        return { shouldNavigate: true, path: "/login" };
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

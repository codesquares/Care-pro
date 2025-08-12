import React from 'react';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

// This wrapper ensures AuthContext has access to Router context
const AuthContextWrapper = ({ children }) => {
    const location = useLocation();
    
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
};

export default AuthContextWrapper;

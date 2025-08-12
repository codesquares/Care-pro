import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoleBasedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, loading, userRole } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-lg font-semibold">Loading authentication...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // Check if user has the required role
    if (isAuthenticated && allowedRoles.includes(userRole)) {
        return children;
    }
    
    // If authenticated but wrong role, redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
};

export default RoleBasedRoute;

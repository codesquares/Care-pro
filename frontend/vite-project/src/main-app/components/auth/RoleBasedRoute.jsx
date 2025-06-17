import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoleBasedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    const userRole = userDetails?.role || null;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-lg font-semibold">Loading authentication...</p>
            </div>
        );
    }

    // Check if authenticated and has the required role
    if (isAuthenticated && allowedRoles.includes(userRole)) {
        return children;
    }
    
    // If authenticated but wrong role, redirect to unauthorized page
    if (isAuthenticated) {
        return <Navigate to="/unauthorized" replace />;
    }
    
    // If not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
};

export default RoleBasedRoute;

import config from "../config";

// Mock Refresh Token API Call
export const refreshToken = async () => {
    try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        const response = await fetch('https://your-api-url.com/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        return data.newAuthToken; // Assume API returns newAuthToken
    } catch (error) {
        console.error('Refresh token failed:', error);
        throw error;
    }
};

// Forgot Password API Call
export const forgotPassword = async (email) => {
    try {
        // TODO: Uncomment when backend API is ready

        const response = await fetch(`${config.BASE_URL}/CareGivers/request-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to send reset email');
        }
         
        return await response.json();
        
    } catch (error) {
        console.error('Forgot password failed:', error);
        throw error;
    }
};

// Reset Password API Call
export const resetPassword = async (email, currentPassword, newPassword) => {
    try {
        // TODO: Uncomment when backend API is ready
        
        const response = await fetch(`${config.BASE_URL}/CareGivers/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, currentPassword, newPassword }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to reset password');
        }

        return await response.json();
        
        
    } catch (error) {
        console.error('Reset password failed:', error);
        throw error;
    }
};

// Logout Function
export const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login'; // Redirect to login page
};

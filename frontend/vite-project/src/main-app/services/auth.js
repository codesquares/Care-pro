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

// Logout Function
export const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login'; // Redirect to login page
};

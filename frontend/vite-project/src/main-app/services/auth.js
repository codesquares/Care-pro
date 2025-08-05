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
        // Try CareGivers endpoint first
        let response = await fetch(`${config.BASE_URL}/CareGivers/request-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        // If CareGiver endpoint fails with 404/user not found, try Clients endpoint
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.message && errorData.message.includes('User not found')) {
                response = await fetch(`${config.BASE_URL}/Clients/request-reset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                
                if (!response.ok) {
                    const clientErrorData = await response.json();
                    throw new Error(clientErrorData.message || 'Failed to send reset email');
                }
            } else {
                throw new Error(errorData.message || 'Failed to send reset email');
            }
        }
         
        return await response.json();
        
    } catch (error) {
        console.error('Forgot password failed:', error);
        throw error;
    }
};

// Reset Password API Call (for authenticated users with current password)
export const resetPassword = async (email, currentPassword, newPassword) => {
    try {
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

// Reset Password with Token API Call (for forgot password flow)
export const resetPasswordWithToken = async (token, newPassword) => {
    try {
        // Try CareGivers endpoint first
        let response = await fetch(`${config.BASE_URL}/CareGivers/resetPassword`, {
            method: 'POST',  
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
        });

        // If CareGiver endpoint fails with 404/user not found, try Clients endpoint
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.message && errorData.message.includes('User not found')) {
                response = await fetch(`${config.BASE_URL}/Clients/resetPassword`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword }),
                });
                
                if (!response.ok) {
                    const clientErrorData = await response.json(); 
                    throw new Error(clientErrorData.message || 'Failed to reset password');
                }
            } else {
                throw new Error(errorData.message || 'Failed to reset password');
            }
        }

        return await response.json();
        
    } catch (error) {
        console.error('Reset password with token failed:', error);
        throw error;
    }
};

// Validate Email Token API Call - validates token and returns user info
export const validateEmailToken = async (token) => {
    try {
        // Try CareGivers endpoint first
        let response = await fetch(`${config.BASE_URL}/CareGivers/validate-email-token?token=${encodeURIComponent(token)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // If CareGiver endpoint fails with 404/user not found, try Clients endpoint
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.message && errorData.message.includes('User not found')) {
                response = await fetch(`${config.BASE_URL}/Clients/validate-email-token?token=${encodeURIComponent(token)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                if (!response.ok) {
                    const clientErrorData = await response.json();
                    throw new Error(clientErrorData.message || 'Failed to validate email token');
                }
            } else {
                throw new Error(errorData.message || 'Failed to validate email token');
            }
        }
        const responseData = await response.json();
        console.log(responseData);
        return responseData;

    } catch (error) {
        console.error('Email token validation failed:', error);
        throw error;
    }
};

// Confirm Email API Call - confirms email using userId and code
export const confirmEmail = async (userId) => {
    try {
        // Try CareGivers endpoint first
        let response = await fetch(`${config.BASE_URL}/CareGivers/confirm-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify( userId),
        });

        // If CareGiver endpoint fails with 404/user not found, try Clients endpoint
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.message && errorData.message.includes('User not found')) {
                response = await fetch(`${config.BASE_URL}/Clients/confirm-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userId),
                });
                
                if (!response.ok) {
                    const clientErrorData = await response.json();
                    throw new Error(clientErrorData.message || 'Failed to confirm email');
                }
            } else {
                throw new Error(errorData.message || 'Failed to confirm email');
            }
        }

        return await response.json();
        
    } catch (error) {
        console.error('Email confirmation failed:', error);
        throw error;
    }
};

// Resend Confirmation Email API Call
export const resendConfirmationEmail = async (email) => {
    try {
        // Try CareGivers endpoint first
        let response = await fetch(`${config.BASE_URL}/CareGivers/resend-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(email),
        });

        console.log('Resend confirmation response status:', response.status);
        // If CareGiver endpoint fails with 404/user not found, try Clients endpoint
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.message && errorData.message.includes('User not found')) {
                response = await fetch(`${config.BASE_URL}/Clients/resend-confirmation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(email),
                });
                
                if (!response.ok) {
                    const clientErrorData = await response.json();
                    throw new Error(clientErrorData.message || 'Failed to send confirmation email');
                }
            } else {
                throw new Error(errorData.message || 'Failed to send confirmation email');
            }
        }
         
        return await response.json();
        
    } catch (error) {
        console.error('Resend confirmation email failed:', error);
        throw error;
    }
};

const validateToken = async (token) => {
    try {
        const response = await fetch(`${config.BASE_URL}/validate-email-token`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Invalid token');
        }

        return await response.json();
    } catch (error) {
        console.error('Token validation failed:', error);
        throw error;
    }
};

// Logout Function
export const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login'; // Redirect to login page
};

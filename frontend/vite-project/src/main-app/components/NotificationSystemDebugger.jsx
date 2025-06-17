import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotificationSystemDebugger = () => {
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [serverUrl, setServerUrl] = useState('https://carepro-api20241118153443.azurewebsites.net');
  const [customHeader, setCustomHeader] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    // Try to get auth token from various storage locations
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('carepro_token') || 
                  sessionStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  const testDirectConnection = async () => {
    setStatus('testing');
    setResults(null);
    setErrorDetails(null);
    
    try {
      const response = await fetch(`${serverUrl}/api/Notifications/unread/count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
          'Access-Control-Allow-Origin': '*',
          ...(customHeader ? JSON.parse(customHeader) : {})
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setResults({
        success: true,
        method: 'fetch API',
        data
      });
      setStatus('success');
    } catch (error) {
      console.error('Fetch test failed:', error);
      setErrorDetails({
        message: error.message,
        stack: error.stack
      });
      
      // Try with axios as fallback
      try {
        const axiosResponse = await axios({
          method: 'get',
          url: `${serverUrl}/api/Notifications/unread/count`,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': window.location.origin,
            'Access-Control-Allow-Origin': '*',
            ...(customHeader ? JSON.parse(customHeader) : {})
          }
        });
        
        setResults({
          success: true,
          method: 'axios fallback',
          data: axiosResponse.data
        });
        setStatus('success');
      } catch (axiosError) {
        console.error('Axios test failed:', axiosError);
        setResults({
          success: false,
          method: 'all methods',
          error: {
            fetchError: error.message,
            axiosError: axiosError.message,
            axiosResponse: axiosError.response ? {
              status: axiosError.response.status,
              data: axiosError.response.data,
              headers: axiosError.response.headers
            } : 'No response'
          }
        });
        setStatus('failed');
      }
    }
  };

  const testTokenValidity = () => {
    try {
      if (!authToken) {
        return { valid: false, reason: 'No token provided' };
      }
      
      const parts = authToken.split('.');
      if (parts.length !== 3) {
        return { valid: false, reason: 'Token is not in valid JWT format (should have 3 parts)' };
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      if (exp < now) {
        return { 
          valid: false, 
          reason: 'Token has expired', 
          expiry: new Date(exp).toLocaleString(),
          current: new Date(now).toLocaleString()
        };
      }
      
      return { 
        valid: true, 
        expiry: new Date(exp).toLocaleString(),
        userId: payload.nameid || payload.sub || 'Unknown',
        roles: payload.role || 'None',
        issuer: payload.iss || 'Unknown'
      };
    } catch (error) {
      return { 
        valid: false, 
        reason: 'Error parsing token', 
        error: error.message 
      };
    }
  };

  const tokenInfo = testTokenValidity();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Notification System Debugger</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Authentication Token</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input 
            type="text" 
            value={authToken} 
            onChange={(e) => setAuthToken(e.target.value)} 
            placeholder="Bearer token"
            style={{ flex: '1', padding: '8px' }}
          />
        </div>
        
        <div style={{ 
          padding: '10px', 
          backgroundColor: tokenInfo.valid ? '#e8f5e9' : '#ffebee',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <h4>Token Validation</h4>
          {tokenInfo.valid ? (
            <ul>
              <li>Status: <strong>Valid</strong></li>
              <li>Expires: {tokenInfo.expiry}</li>
              <li>User ID: {tokenInfo.userId}</li>
              <li>Roles: {tokenInfo.roles}</li>
              <li>Issuer: {tokenInfo.issuer}</li>
            </ul>
          ) : (
            <p><strong>Invalid token:</strong> {tokenInfo.reason}</p>
          )}
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Server Configuration</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input 
            type="text" 
            value={serverUrl} 
            onChange={(e) => setServerUrl(e.target.value)} 
            placeholder="Server URL"
            style={{ flex: '1', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <h4>Custom Headers (Optional JSON)</h4>
          <textarea
            value={customHeader}
            onChange={(e) => setCustomHeader(e.target.value)}
            placeholder='{"X-Custom-Header": "value"}'
            style={{ width: '100%', height: '60px', padding: '8px' }}
          />
        </div>
      </div>
      
      <button 
        onClick={testDirectConnection}
        disabled={status === 'testing'}
        style={{
          padding: '10px 16px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: status === 'testing' ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {status === 'testing' ? 'Testing...' : 'Test Direct Connection'}
      </button>
      
      {results && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: results.success ? '#e8f5e9' : '#ffebee',
          borderRadius: '4px' 
        }}>
          <h3>Test Results</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
      
      {errorDetails && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#fff8e1',
          borderRadius: '4px' 
        }}>
          <h3>Error Details</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(errorDetails, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default NotificationSystemDebugger;

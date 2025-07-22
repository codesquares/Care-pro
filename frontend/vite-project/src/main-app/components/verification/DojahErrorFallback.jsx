import React from 'react';
import config from '../../config';

/**
 * DojahErrorFallback Component
 * 
 * Displays when Dojah initialization fails with helpful debugging info
 */
const DojahErrorFallback = ({ error, retry }) => {
  const checkDojahStatus = () => {
    const status = {
      config_available: !!config,
      dojah_app_id: config?.DOJAH?.APP_ID || 'missing',
      dojah_widget_id: config?.DOJAH?.WIDGET_ID || 'missing',
      identity_url: config?.DOJAH?.IDENTITY_URL || 'missing',
      env_variables: {
        VITE_DOJAH_APP_ID: import.meta.env.VITE_DOJAH_APP_ID || 'not set',
        VITE_DOJAH_WIDGET_ID: import.meta.env.VITE_DOJAH_WIDGET_ID || 'not set'
      },
      globals: {
        ENV: !!window.ENV,
        Dojah: !!window.Dojah
      }
    };
    
    console.log('🔍 Dojah Debug Status:', status);
    return status;
  };

  const status = checkDojahStatus();

  return (
    <div style={{
      border: '2px solid #ff6b6b',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#fff5f5',
      margin: '20px 0'
    }}>
      <h3 style={{ color: '#d63031', margin: '0 0 15px 0' }}>
        🚨 Dojah Verification Unavailable
      </h3>
      
      <p style={{ margin: '0 0 15px 0' }}>
        <strong>Error:</strong> {error}
      </p>

      <details style={{ marginBottom: '15px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          🔍 Technical Details (Click to expand)
        </summary>
        <pre style={{ 
          background: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto',
          marginTop: '10px'
        }}>
          {JSON.stringify(status, null, 2)}
        </pre>
      </details>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={retry}
          style={{
            backgroundColor: '#00b894',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Retry Verification
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#0984e3',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔃 Reload Page
        </button>
      </div>

      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        backgroundColor: '#e8f4f8', 
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>💡 Troubleshooting:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Check browser console for additional errors</li>
          <li>Ensure internet connection is stable</li>
          <li>Try disabling browser extensions temporarily</li>
          <li>Clear browser cache and cookies</li>
        </ul>
      </div>
    </div>
  );
};

export default DojahErrorFallback;

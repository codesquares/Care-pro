import React, { useState, useEffect } from 'react';
import { testNotificationApi, diagnosisTools } from '../services/notificationService';

const NotificationDiagnostics = () => {
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const runDiagnostics = async () => {
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const results = await diagnosisTools.runAllTests();
      setDiagnosticResults(results);
      console.log('Diagnostic results:', results);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      setErrorMsg(`Error running diagnostics: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const runApiTest = async () => {
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const result = await testNotificationApi();
      setDiagnosticResults({ apiTest: result });
      console.log('API test result:', result);
    } catch (error) {
      console.error('Error running API test:', error);
      setErrorMsg(`Error running API test: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="notification-diagnostics">
      <h2>Notification System Diagnostics</h2>
      
      <div className="diagnostic-controls">
        <button 
          onClick={runDiagnostics} 
          disabled={isLoading}
          className="diagnostic-button"
        >
          {isLoading ? 'Running...' : 'Run Full Diagnostics'}
        </button>
        
        <button 
          onClick={runApiTest} 
          disabled={isLoading}
          className="diagnostic-button"
        >
          {isLoading ? 'Testing...' : 'Test Notification API'}
        </button>
      </div>
      
      {errorMsg && (
        <div className="error-message">
          {errorMsg}
        </div>
      )}
      
      {diagnosticResults && (
        <div className="diagnostic-results">
          <h3>Results:</h3>
          <pre>{JSON.stringify(diagnosticResults, null, 2)}</pre>
        </div>
      )}
      
      <style jsx>{`
        .notification-diagnostics {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .diagnostic-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .diagnostic-button {
          padding: 8px 16px;
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .diagnostic-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .error-message {
          padding: 10px;
          background-color: #ffeeee;
          border: 1px solid #ffcccc;
          color: #cc0000;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .diagnostic-results {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow: auto;
        }
        
        pre {
          white-space: pre-wrap;
          word-break: break-all;
        }
      `}</style>
    </div>
  );
};

export default NotificationDiagnostics;

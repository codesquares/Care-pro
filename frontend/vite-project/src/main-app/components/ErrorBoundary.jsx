import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>🔧 Something went wrong</h2>
            <p>We encountered an unexpected error while loading the dashboard.</p>
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '16px' }}>
              <summary>Error Details (for developers)</summary>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo.componentStack}
            </details>
            <div className="error-boundary-actions">
              <button 
                onClick={() => window.location.reload()}
                className="error-boundary-btn"
              >
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/app/caregiver/dashboard'}
                className="error-boundary-btn secondary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import './index.css';
import { Provider } from 'react-redux';
import  store  from '../src/main-app/Redux/store.js';

// Make React available globally for older components
window.React = React;

// One-time cleanup: drop stale Dojah widget state from before the server-side
// gate rollout (May 2026). Stale referenceIds in this cache fail the new
// /Dojah/initiate-session check. Safe to remove next sprint.
try { localStorage.removeItem('pendingVerificationData'); } catch { /* ignore */ }


createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </HelmetProvider>
  // </StrictMode>,
);

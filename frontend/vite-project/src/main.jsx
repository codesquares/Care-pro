import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import './index.css';
import { Provider } from 'react-redux';
import  store  from '../src/main-app/Redux/store.js';

// Make React available globally for older components
window.React = React;


createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </HelmetProvider>
  // </StrictMode>,
);

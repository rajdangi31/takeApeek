import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import App from './App.tsx'
import { BrowserRouter as Router } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from './contexts/AuthContext.tsx';

const client = new QueryClient()

// Enhanced Service Worker Registration for Vercel
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔄 Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Force fresh SW on updates
      });
      
      console.log('✅ Service worker registered:', registration);
      
      // Wait for it to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready and active');
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service worker update found');
      });
      
      return registration;
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
      throw error;
    }
  } else {
    console.warn('⚠️ Service workers not supported');
  }
};

// Initialize service worker when page loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Only register in production or localhost
    if (process.env.NODE_ENV === 'production' || window.location.hostname === 'localhost') {
      registerServiceWorker().catch(console.error);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Router>
          <App />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './features/auth/AuthContext';

// Enhanced Service Worker Registration for Vercel
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔄 Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      console.log('✅ Service worker registered:', registration);
      await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready and active');
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

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD || window.location.hostname === 'localhost') {
      registerServiceWorker().catch(console.error);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </QueryClientProvider>
);
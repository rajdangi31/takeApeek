import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './features/auth/AuthContext';

// NUCLEAR CACHE BUSTER: Unregister all service workers and wipe caches
const purgeCacheAndSW = async () => {
  if (typeof window !== 'undefined') {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        console.log('🗑️ Force unregistering SW:', registration);
        await registration.unregister();
      }
    }
    // 2. Clear all named caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (let name of cacheNames) {
        console.log('🗑️ Wiping cache:', name);
        await caches.delete(name);
      }
    }
    console.log('✨ Cache & SW Purge Complete.');
  }
};

// Execute purge immediately
purgeCacheAndSW().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </QueryClientProvider>
);
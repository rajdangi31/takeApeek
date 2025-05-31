// Add this to your main App.tsx or main.tsx file

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔄 Registering service worker...');
      
      // Try different paths - Vercel sometimes needs explicit paths
      const swPaths = ['/sw.js', './sw.js', '/public/sw.js'];
      let registration = null;
      
      for (const path of swPaths) {
        try {
          console.log(`🔄 Trying SW path: ${path}`);
          registration = await navigator.serviceWorker.register(path, {
            scope: '/' // Ensure scope is root
          });
          console.log(`✅ Service worker registered successfully with path: ${path}`);
          break;
        } catch (err) {
          console.log(`❌ Failed with path ${path}:`, err);
          continue;
        }
      }
      
      if (!registration) {
        throw new Error('Failed to register service worker with any path');
      }

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service worker is ready');

      // Check if there's an active service worker
      if (registration.active) {
        console.log('✅ Service worker is active');
      } else {
        console.log('🔄 Waiting for service worker to activate...');
        // Wait for activation
        await new Promise((resolve) => {
          const checkActive = () => {
            if (registration.active) {
              resolve(registration.active);
            } else {
              setTimeout(checkActive, 100);
            }
          };
          checkActive();
        });
        console.log('✅ Service worker activated');
      }

      return registration;
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
      throw error;
    }
  } else {
    throw new Error('Service workers not supported');
  }
};

// Call this when your app starts
export const initializeApp = async () => {
  try {
    await registerServiceWorker();
    console.log('🎉 App initialized with service worker');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
};
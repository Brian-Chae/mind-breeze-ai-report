import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Cache busting - 브라우저 캐시 강제 새로고침
const forceCacheRefresh = () => {
  const buildTimestamp = document.querySelector('meta[name="build-timestamp"]')?.getAttribute('content');
  const storedTimestamp = localStorage.getItem('app-build-timestamp');
  
  if (buildTimestamp && buildTimestamp !== 'BUILD_TIMESTAMP_PLACEHOLDER') {
    if (storedTimestamp && storedTimestamp !== buildTimestamp) {
      console.log('🔄 New build detected, clearing cache...');
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      const keysToPreserve = ['mindbreeze-settings', 'mindbreeze-storage-config'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToPreserve.some(preserve => key.includes(preserve))) {
          localStorage.removeItem(key);
        }
      });
    }
    localStorage.setItem('app-build-timestamp', buildTimestamp);
  }
};

forceCacheRefresh();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
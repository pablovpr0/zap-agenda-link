
const CACHE_NAME = 'zapagenda-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/lovable-uploads/b3ff3af2-efb5-406a-bac6-c7b3b5002543.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip caching for development server requests
  if (event.request.url.includes('localhost') && 
      (event.request.url.includes('@vite') || 
       event.request.url.includes('@react-refresh') ||
       event.request.url.includes('.tsx') ||
       event.request.url.includes('.ts') ||
       event.request.url.includes('src/'))) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(() => {
        // If fetch fails, return a basic response for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

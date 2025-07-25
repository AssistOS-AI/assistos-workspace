const CACHE_NAME = 'virtual-widgets';
const WEB_COMPONENTS_ROOT = 'iframes/chat/web-components';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([]);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const request = event.request;

    if (request.method !== 'GET' || url.pathname.includes('/public/chats')) {
        event.respondWith(fetch(request));
        return;
    }

    if (url.pathname.includes(`${WEB_COMPONENTS_ROOT}/virtual/widgets`)) {
        event.respondWith(
            caches.match(request).then(response => response || fetch(request))
        );
        return;
    }
    if(url.pathname.includes("internalWebhook")){
        return;
    }
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});
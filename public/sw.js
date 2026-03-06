// KILLER SERVICE WORKER
// This SW is designed to delete all old caches and unregister itself to fix the White Screen issue.

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            // Delete ALL caches
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            // Unregister self
            return self.registration.unregister();
        }).then(() => {
            // Force reload all clients
            return self.clients.matchAll();
        }).then((clients) => {
            clients.forEach((client) => client.navigate(client.url));
        })
    );
});

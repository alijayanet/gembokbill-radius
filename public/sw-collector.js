const CACHE_NAME = 'gembok-collector-v1';
const urlsToCache = [
  '/collector/dashboard',
  '/collector/payment',
  '/collector/customers',
  '/collector/payments',
  '/collector/profile',
  '/css/collector-pwa.css',
  '/js/collector-pwa.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

// Install event
self.addEventListener('install', function(event) {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('Service Worker: Cache failed', error);
      })
  );
});

// Fetch event
self.addEventListener('fetch', function(event) {
  console.log('Service Worker: Fetch', event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }
        
        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request)
          .then(function(response) {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(function(error) {
            console.log('Service Worker: Fetch failed', error);
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/collector/dashboard');
            }
          });
      })
  );
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activate');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline payments
self.addEventListener('sync', function(event) {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-payment-sync') {
    event.waitUntil(syncOfflinePayments());
  }
});

// Sync offline payments when back online
function syncOfflinePayments() {
  return new Promise(function(resolve, reject) {
    // Get offline payments from IndexedDB
    const request = indexedDB.open('CollectorOfflineDB', 1);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['payments'], 'readonly');
      const store = transaction.objectStore('payments');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = function() {
        const offlinePayments = getAllRequest.result;
        
        if (offlinePayments.length > 0) {
          console.log('Service Worker: Syncing', offlinePayments.length, 'offline payments');
          
          // Sync each payment
          offlinePayments.forEach(function(payment) {
            fetch('/collector/api/payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payment)
            })
            .then(function(response) {
              if (response.ok) {
                // Remove from offline storage
                const deleteTransaction = db.transaction(['payments'], 'readwrite');
                const deleteStore = deleteTransaction.objectStore('payments');
                deleteStore.delete(payment.id);
                console.log('Service Worker: Payment synced successfully');
              }
            })
            .catch(function(error) {
              console.log('Service Worker: Payment sync failed', error);
            });
          });
        }
        
        resolve();
      };
      
      getAllRequest.onerror = function() {
        reject(getAllRequest.error);
      };
    };
    
    request.onerror = function() {
      reject(request.error);
    };
  });
}

// Push notification handling
self.addEventListener('push', function(event) {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Pembayaran baru diterima',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Lihat Detail',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Tutup',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('GEMBOK-BILL Collector', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/collector/payments')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open dashboard
    event.waitUntil(
      clients.openWindow('/collector/dashboard')
    );
  }
});

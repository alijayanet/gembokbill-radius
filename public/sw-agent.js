const CACHE_NAME = 'gembok-agent-v1';
const urlsToCache = [
  '/agent/dashboard',
  '/agent/vouchers',
  '/agent/payments',
  '/agent/balance',
  '/agent/transactions',
  '/agent/profile',
  '/agent/notifications',
  '/css/agent-pwa.css',
  '/js/agent-pwa.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// Install event
self.addEventListener('install', function(event) {
  console.log('Agent Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Agent Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('Agent Service Worker: Cache failed', error);
      })
  );
});

// Fetch event
self.addEventListener('fetch', function(event) {
  console.log('Agent Service Worker: Fetch', event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Use network-first strategy for agent routes to prevent stale content
  if (event.request.url.includes('/agent/')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // Cache the response for offline use
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(function(error) {
          // If network fails, try cache
          console.log('Agent Service Worker: Network failed, trying cache', error);
          return caches.match(event.request)
            .then(function(response) {
              if (response) {
                console.log('Agent Service Worker: Serving from cache', event.request.url);
                return response;
              }
              // Return offline page for navigation requests
              if (event.request.mode === 'navigate') {
                return caches.match('/agent/dashboard');
              }
              throw error;
            });
        })
    );
  } else {
    // For non-agent routes, use cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          // Return cached version or fetch from network
          if (response) {
            console.log('Agent Service Worker: Serving from cache', event.request.url);
            return response;
          }
          
          console.log('Agent Service Worker: Fetching from network', event.request.url);
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
              console.log('Agent Service Worker: Fetch failed', error);
              // Return offline page for navigation requests
              if (event.request.mode === 'navigate') {
                return caches.match('/agent/dashboard');
              }
            });
        })
    );
  }
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('Agent Service Worker: Activate');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Agent Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', function(event) {
  console.log('Agent Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-agent-sync') {
    event.waitUntil(syncOfflineAgentData());
  }
});

// Sync offline agent data when back online
function syncOfflineAgentData() {
  return new Promise(function(resolve, reject) {
    // Get offline data from IndexedDB
    const request = indexedDB.open('AgentOfflineDB', 1);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['vouchers', 'payments'], 'readonly');
      
      // Sync offline vouchers
      const voucherStore = transaction.objectStore('vouchers');
      const voucherRequest = voucherStore.getAll();
      
      voucherRequest.onsuccess = function() {
        const offlineVouchers = voucherRequest.result;
        
        if (offlineVouchers.length > 0) {
          console.log('Agent Service Worker: Syncing', offlineVouchers.length, 'offline vouchers');
          
          offlineVouchers.forEach(function(voucher) {
            fetch('/agent/api/vouchers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(voucher)
            })
            .then(function(response) {
              if (response.ok) {
                // Remove from offline storage
                const deleteTransaction = db.transaction(['vouchers'], 'readwrite');
                const deleteStore = deleteTransaction.objectStore('vouchers');
                deleteStore.delete(voucher.id);
                console.log('Agent Service Worker: Voucher synced successfully');
              }
            })
            .catch(function(error) {
              console.log('Agent Service Worker: Voucher sync failed', error);
            });
          });
        }
      };
      
      // Sync offline payments
      const paymentStore = transaction.objectStore('payments');
      const paymentRequest = paymentStore.getAll();
      
      paymentRequest.onsuccess = function() {
        const offlinePayments = paymentRequest.result;
        
        if (offlinePayments.length > 0) {
          console.log('Agent Service Worker: Syncing', offlinePayments.length, 'offline payments');
          
          offlinePayments.forEach(function(payment) {
            fetch('/agent/api/payments', {
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
                console.log('Agent Service Worker: Payment synced successfully');
              }
            })
            .catch(function(error) {
              console.log('Agent Service Worker: Payment sync failed', error);
            });
          });
        }
      };
      
      resolve();
    };
    
    request.onerror = function() {
      reject(request.error);
    };
  });
}

// Push notification handling
self.addEventListener('push', function(event) {
  console.log('Agent Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Transaksi baru tersedia',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
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
    self.registration.showNotification('GEMBOK-BILL Agent', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', function(event) {
  console.log('Agent Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/agent/transactions')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open dashboard
    event.waitUntil(
      clients.openWindow('/agent/dashboard')
    );
  }
});

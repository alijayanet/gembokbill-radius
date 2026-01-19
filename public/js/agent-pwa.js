// PWA Agent JavaScript
class AgentPWA {
    constructor() {
        this.deferredPrompt = null;
        this.isOnline = navigator.onLine;
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOfflineDetection();
        this.setupBackgroundSync();
        this.setupPushNotifications();
        this.setupThemeDetection();
    }

    // Service Worker Registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw-agent.js');
                console.log('Agent PWA: Service Worker registered successfully', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.error('Agent PWA: Service Worker registration failed', error);
            }
        }
    }

    // Install Prompt
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('Agent PWA: Install prompt triggered');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        window.addEventListener('appinstalled', () => {
            console.log('Agent PWA: App installed successfully');
            this.hideInstallPrompt();
            this.deferredPrompt = null;
        });
    }

    showInstallPrompt() {
        const prompt = document.getElementById('pwa-install-prompt');
        if (prompt) {
            prompt.classList.add('show');
        } else {
            this.createInstallPrompt();
        }
    }

    createInstallPrompt() {
        const promptHTML = `
            <div id="pwa-install-prompt" class="pwa-install-prompt">
                <div class="pwa-install-content">
                    <div class="pwa-install-icon">
                        <i class="fas fa-download"></i>
                    </div>
                    <div class="pwa-install-text">
                        <h6 class="pwa-install-title">Install App</h6>
                        <p class="pwa-install-description">Install aplikasi agent untuk akses yang lebih mudah</p>
                    </div>
                </div>
                <div class="pwa-install-actions">
                    <button class="pwa-btn pwa-btn-secondary" onclick="agentPWA.hideInstallPrompt()">
                        Nanti
                    </button>
                    <button class="pwa-btn pwa-btn-primary" onclick="agentPWA.installApp()">
                        Install
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', promptHTML);
    }

    hideInstallPrompt() {
        const prompt = document.getElementById('pwa-install-prompt');
        if (prompt) {
            prompt.classList.remove('show');
        }
    }

    async installApp() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log('Agent PWA: Install prompt outcome', outcome);
            this.deferredPrompt = null;
        }
    }

    // Offline Detection
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            console.log('Agent PWA: Back online');
            this.isOnline = true;
            this.hideOfflineIndicator();
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            console.log('Agent PWA: Gone offline');
            this.isOnline = false;
            this.showOfflineIndicator();
        });

        // Initial check
        if (!this.isOnline) {
            this.showOfflineIndicator();
        }
    }

    showOfflineIndicator() {
        const indicator = document.getElementById('pwa-offline-indicator');
        if (indicator) {
            indicator.classList.add('show');
        } else {
            this.createOfflineIndicator();
        }
    }

    createOfflineIndicator() {
        const indicatorHTML = `
            <div id="pwa-offline-indicator" class="pwa-offline-indicator">
                <i class="fas fa-wifi me-2"></i>
                Anda sedang offline. Data akan disinkronkan saat kembali online.
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', indicatorHTML);
    }

    hideOfflineIndicator() {
        const indicator = document.getElementById('pwa-offline-indicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    }

    // Background Sync
    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            // Register for background sync
            navigator.serviceWorker.ready.then(registration => {
                return registration.sync.register('background-agent-sync');
            }).catch(error => {
                console.log('Agent PWA: Background sync registration failed', error);
            });
        }
    }

    // Push Notifications
    async setupPushNotifications() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                console.log('Agent PWA: Push notifications enabled');
                this.subscribeToPush();
            } else {
                console.log('Agent PWA: Push notifications denied');
            }
        }
    }

    async subscribeToPush() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
            });
            
            // Send subscription to server
            await fetch('/agent/api/push-subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription)
            });
            
            console.log('Agent PWA: Push subscription successful');
        } catch (error) {
            console.error('Agent PWA: Push subscription failed', error);
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Theme Detection
    setupThemeDetection() {
        // Check for dark mode preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
        }

        // Listen for theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (e.matches) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        });
    }

    // Offline Data Storage
    async storeOfflineVoucher(voucherData) {
        if (!this.isOnline) {
            try {
                const db = await this.openOfflineDB();
                const transaction = db.transaction(['vouchers'], 'readwrite');
                const store = transaction.objectStore('vouchers');
                
                const offlineVoucher = {
                    ...voucherData,
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    synced: false
                };
                
                await store.add(offlineVoucher);
                console.log('Agent PWA: Voucher stored offline', offlineVoucher);
                
                this.showOfflineMessage('Voucher disimpan offline dan akan disinkronkan saat online');
            } catch (error) {
                console.error('Agent PWA: Failed to store offline voucher', error);
            }
        }
    }

    async storeOfflinePayment(paymentData) {
        if (!this.isOnline) {
            try {
                const db = await this.openOfflineDB();
                const transaction = db.transaction(['payments'], 'readwrite');
                const store = transaction.objectStore('payments');
                
                const offlinePayment = {
                    ...paymentData,
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    synced: false
                };
                
                await store.add(offlinePayment);
                console.log('Agent PWA: Payment stored offline', offlinePayment);
                
                this.showOfflineMessage('Pembayaran disimpan offline dan akan disinkronkan saat online');
            } catch (error) {
                console.error('Agent PWA: Failed to store offline payment', error);
            }
        }
    }

    async syncOfflineData() {
        if (this.isOnline) {
            try {
                const db = await this.openOfflineDB();
                
                // Sync offline vouchers
                const voucherTransaction = db.transaction(['vouchers'], 'readonly');
                const voucherStore = voucherTransaction.objectStore('vouchers');
                const voucherRequest = voucherStore.getAll();
                
                voucherRequest.onsuccess = async () => {
                    const offlineVouchers = voucherRequest.result;
                    
                    for (const voucher of offlineVouchers) {
                        try {
                            const response = await fetch('/agent/api/vouchers', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(voucher)
                            });
                            
                            if (response.ok) {
                                // Remove from offline storage
                                const deleteTransaction = db.transaction(['vouchers'], 'readwrite');
                                const deleteStore = deleteTransaction.objectStore('vouchers');
                                deleteStore.delete(voucher.id);
                                console.log('Agent PWA: Offline voucher synced', voucher.id);
                            }
                        } catch (error) {
                            console.error('Agent PWA: Failed to sync offline voucher', error);
                        }
                    }
                };
                
                // Sync offline payments
                const paymentTransaction = db.transaction(['payments'], 'readonly');
                const paymentStore = paymentTransaction.objectStore('payments');
                const paymentRequest = paymentStore.getAll();
                
                paymentRequest.onsuccess = async () => {
                    const offlinePayments = paymentRequest.result;
                    
                    for (const payment of offlinePayments) {
                        try {
                            const response = await fetch('/agent/api/payments', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(payment)
                            });
                            
                            if (response.ok) {
                                // Remove from offline storage
                                const deleteTransaction = db.transaction(['payments'], 'readwrite');
                                const deleteStore = deleteTransaction.objectStore('payments');
                                deleteStore.delete(payment.id);
                                console.log('Agent PWA: Offline payment synced', payment.id);
                            }
                        } catch (error) {
                            console.error('Agent PWA: Failed to sync offline payment', error);
                        }
                    }
                };
            } catch (error) {
                console.error('Agent PWA: Failed to sync offline data', error);
            }
        }
    }

    async openOfflineDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('AgentOfflineDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('vouchers')) {
                    const voucherStore = db.createObjectStore('vouchers', { keyPath: 'id' });
                    voucherStore.createIndex('timestamp', 'timestamp', { unique: false });
                    voucherStore.createIndex('synced', 'synced', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('payments')) {
                    const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
                    paymentStore.createIndex('timestamp', 'timestamp', { unique: false });
                    paymentStore.createIndex('synced', 'synced', { unique: false });
                }
            };
        });
    }

    // Utility Methods
    showOfflineMessage(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'pwa-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
            font-size: 0.9rem;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showUpdateNotification() {
        if (confirm('Update tersedia! Apakah Anda ingin memperbarui aplikasi?')) {
            window.location.reload();
        }
    }

    // PWA-specific UI enhancements
    enhanceUI() {
        // Add PWA classes to existing elements
        const cards = document.querySelectorAll('.card, .profile-card, .stat-card');
        cards.forEach(card => {
            card.classList.add('pwa-card');
        });

        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            if (btn.classList.contains('btn-primary')) {
                btn.classList.add('pwa-btn', 'pwa-btn-primary');
            } else if (btn.classList.contains('btn-secondary')) {
                btn.classList.add('pwa-btn', 'pwa-btn-secondary');
            } else if (btn.classList.contains('btn-success')) {
                btn.classList.add('pwa-btn', 'pwa-btn-success');
            } else if (btn.classList.contains('btn-danger')) {
                btn.classList.add('pwa-btn', 'pwa-btn-danger');
            }
        });

        const forms = document.querySelectorAll('.form-control');
        forms.forEach(form => {
            form.classList.add('pwa-form-control');
        });

        const labels = document.querySelectorAll('.form-label');
        labels.forEach(label => {
            label.classList.add('pwa-form-label');
        });
    }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.agentPWA = new AgentPWA();
    window.agentPWA.enhanceUI();
});

// Export for global access
window.AgentPWA = AgentPWA;

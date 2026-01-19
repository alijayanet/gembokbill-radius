/**
 * Technician Mobile JavaScript
 * Handles mobile interactions and enhancements for technician portal interface
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize technician mobile interface
    initTechnicianMobile();
    
    // Add touch feedback for interactive elements
    addTouchFeedback();
    
    // Initialize haptic feedback
    initHapticFeedback();
    
    // Add pull-to-refresh functionality
    initPullToRefresh();
    
    // Initialize technician specific features
    initTechnicianFeatures();
});

/**
 * Initialize technician mobile interface
 */
function initTechnicianMobile() {
    console.log('Initializing Technician Mobile Interface...');
    
    // Add loading states to stats cards
    const statCards = document.querySelectorAll('.tech-stat-card');
    statCards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.add('tech-loading');
            setTimeout(() => {
                this.classList.remove('tech-loading');
            }, 1500);
        });
    });
    
    // Add ripple effect to menu cards
    const menuCards = document.querySelectorAll('.tech-menu-card');
    menuCards.forEach(card => {
        card.addEventListener('click', function(e) {
            createRippleEffect(e, this);
        });
    });
    
    // Add active state management for navigation
    updateActiveNavigation();
    
    // Add smooth scrolling for better mobile experience
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Initialize technician role specific features
    initRoleSpecificFeatures();
}

/**
 * Initialize role specific features
 */
function initRoleSpecificFeatures() {
    const technicianRole = document.body.getAttribute('data-technician-role') || 'technician';
    
    switch(technicianRole) {
        case 'field_officer':
            initFieldOfficerFeatures();
            addFieldOfficerQuickActions();
            break;
        case 'collector':
            initCollectorFeatures();
            addCollectorQuickActions();
            break;
        case 'technician':
        default:
            initTechnicianFeatures();
            addTechnicianQuickActions();
            break;
    }
}

/**
 * Initialize field officer specific features
 */
function initFieldOfficerFeatures() {
    console.log('Initializing Field Officer features...');
    
    // Initialize mapping features
    initMappingFeatures();
    
    // Initialize installation management
    initInstallationManagement();
}

/**
 * Initialize collector specific features
 */
function initCollectorFeatures() {
    console.log('Initializing Collector features...');
    
    // Initialize payment collection
    initPaymentCollection();
    
    // Initialize customer management
    initCustomerManagement();
}

/**
 * Initialize technician specific features
 */
function initTechnicianFeatures() {
    console.log('Initializing Technician features...');
    
    // Initialize trouble ticket management
    initTroubleTicketManagement();
    
    // Initialize device monitoring
    initDeviceMonitoring();
}

/**
 * Add field officer quick actions
 */
function addFieldOfficerQuickActions() {
    const quickActionsContainer = document.querySelector('.tech-quick-actions .tech-action-buttons');
    if (!quickActionsContainer) return;
    
    // Add field officer specific actions
    const fieldOfficerActions = [
        {
            icon: 'bi bi-geo-alt',
            text: 'View Map',
            action: 'viewMap'
        },
        {
            icon: 'bi bi-tools',
            text: 'Installations',
            action: 'viewInstallations'
        },
        {
            icon: 'bi bi-people',
            text: 'Customers',
            action: 'viewCustomers'
        },
        {
            icon: 'bi bi-exclamation-triangle',
            text: 'Trouble Tickets',
            action: 'viewTroubleTickets'
        }
    ];
    
    fieldOfficerActions.forEach(action => {
        const button = createQuickActionButton(action);
        quickActionsContainer.appendChild(button);
    });
}

/**
 * Add collector quick actions
 */
function addCollectorQuickActions() {
    const quickActionsContainer = document.querySelector('.tech-quick-actions .tech-action-buttons');
    if (!quickActionsContainer) return;
    
    // Add collector specific actions
    const collectorActions = [
        {
            icon: 'bi bi-cash-stack',
            text: 'Record Payment',
            action: 'recordPayment'
        },
        {
            icon: 'bi bi-receipt',
            text: 'View Invoices',
            action: 'viewInvoices'
        },
        {
            icon: 'bi bi-people',
            text: 'Customers',
            action: 'viewCustomers'
        },
        {
            icon: 'bi bi-graph-up',
            text: 'Reports',
            action: 'viewReports'
        }
    ];
    
    collectorActions.forEach(action => {
        const button = createQuickActionButton(action);
        quickActionsContainer.appendChild(button);
    });
}

/**
 * Add technician quick actions
 */
function addTechnicianQuickActions() {
    const quickActionsContainer = document.querySelector('.tech-quick-actions .tech-action-buttons');
    if (!quickActionsContainer) return;
    
    // Add technician specific actions
    const technicianActions = [
        {
            icon: 'bi bi-wifi',
            text: 'Monitor Devices',
            action: 'monitorDevices'
        },
        {
            icon: 'bi bi-exclamation-triangle',
            text: 'Trouble Tickets',
            action: 'viewTroubleTickets'
        },
        {
            icon: 'bi bi-people',
            text: 'Customers',
            action: 'viewCustomers'
        },
        {
            icon: 'bi bi-geo-alt',
            text: 'Network Map',
            action: 'viewMap'
        }
    ];
    
    technicianActions.forEach(action => {
        const button = createQuickActionButton(action);
        quickActionsContainer.appendChild(button);
    });
}

/**
 * Create quick action button
 */
function createQuickActionButton(action) {
    const button = document.createElement('button');
    button.className = 'tech-action-btn';
    button.innerHTML = `<i class="${action.icon}"></i> ${action.text}`;
    button.onclick = () => handleQuickAction(action.action);
    return button;
}

/**
 * Handle quick actions
 */
function handleQuickAction(action) {
    const actions = {
        'viewMap': () => window.location.href = '/technician/mapping',
        'viewInstallations': () => window.location.href = '/technician/installations',
        'viewCustomers': () => window.location.href = '/technician/customers',
        'viewTroubleTickets': () => window.location.href = '/technician/troubletickets',
        'monitorDevices': () => window.location.href = '/technician/monitoring',
        'recordPayment': () => showQuickModal('Record Payment', 'payment-form'),
        'viewInvoices': () => window.location.href = '/technician/payments',
        'viewReports': () => showQuickModal('Reports', 'report-form')
    };
    
    if (actions[action]) {
        actions[action]();
    }
}

/**
 * Initialize mapping features
 */
function initMappingFeatures() {
    // Add map interaction handlers
    const mapElements = document.querySelectorAll('[data-map-feature]');
    mapElements.forEach(element => {
        element.addEventListener('click', handleMapFeature);
    });
}

/**
 * Handle map features
 */
function handleMapFeature(event) {
    const feature = event.currentTarget.getAttribute('data-map-feature');
    console.log('Map feature clicked:', feature);
    
    // Implement map feature handling
    switch(feature) {
        case 'device-location':
            showDeviceLocation(event.currentTarget.dataset.deviceId);
            break;
        case 'odp-info':
            showODPInfo(event.currentTarget.dataset.odpId);
            break;
        case 'customer-location':
            showCustomerLocation(event.currentTarget.dataset.customerId);
            break;
    }
}

/**
 * Initialize installation management
 */
function initInstallationManagement() {
    // Add installation status update handlers
    const statusButtons = document.querySelectorAll('[data-installation-status]');
    statusButtons.forEach(button => {
        button.addEventListener('click', handleInstallationStatusUpdate);
    });
}

/**
 * Handle installation status update
 */
function handleInstallationStatusUpdate(event) {
    const button = event.currentTarget;
    const jobId = button.dataset.jobId;
    const newStatus = button.dataset.installationStatus;
    
    if (confirm(`Update installation status to ${newStatus}?`)) {
        updateInstallationStatus(jobId, newStatus);
    }
}

/**
 * Update installation status
 */
async function updateInstallationStatus(jobId, status) {
    try {
        const response = await fetch('/technician/installations/update-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobId: jobId,
                status: status
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Installation status updated successfully', 'success');
            // Refresh the page or update UI
            setTimeout(() => location.reload(), 1000);
        } else {
            showNotification('Failed to update status: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error updating installation status:', error);
        showNotification('Error updating status', 'error');
    }
}

/**
 * Initialize payment collection
 */
function initPaymentCollection() {
    // Add payment form handlers
    const paymentForms = document.querySelectorAll('[data-payment-form]');
    paymentForms.forEach(form => {
        form.addEventListener('submit', handlePaymentSubmission);
    });
}

/**
 * Handle payment submission
 */
function handlePaymentSubmission(event) {
    event.preventDefault();
    
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    // Validate payment data
    const invoiceId = formData.get('invoice_id');
    const amount = formData.get('amount');
    
    if (!invoiceId || !amount) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Submit payment
    submitPayment(formData);
}

/**
 * Submit payment
 */
async function submitPayment(formData) {
    try {
        const response = await fetch('/technician/payments/record', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Payment recorded successfully', 'success');
            // Reset form or redirect
            setTimeout(() => location.reload(), 1000);
        } else {
            showNotification('Failed to record payment: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error recording payment:', error);
        showNotification('Error recording payment', 'error');
    }
}

/**
 * Initialize customer management
 */
function initCustomerManagement() {
    // Add customer search handlers
    const searchInputs = document.querySelectorAll('[data-customer-search]');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(handleCustomerSearch, 300));
    });
}

/**
 * Handle customer search
 */
function handleCustomerSearch(event) {
    const query = event.target.value;
    if (query.length < 2) return;
    
    // Implement customer search
    searchCustomers(query);
}

/**
 * Search customers
 */
async function searchCustomers(query) {
    try {
        const response = await fetch(`/technician/api/customers?search=${encodeURIComponent(query)}`);
        const result = await response.json();
        
        if (result.success) {
            displayCustomerSearchResults(result.customers);
        }
    } catch (error) {
        console.error('Error searching customers:', error);
    }
}

/**
 * Display customer search results
 */
function displayCustomerSearchResults(customers) {
    const resultsContainer = document.getElementById('customer-search-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = customers.map(customer => `
        <div class="tech-menu-card" onclick="selectCustomer(${customer.id})">
            <div class="tech-menu-title">${customer.name}</div>
            <div class="tech-menu-description">${customer.phone}</div>
        </div>
    `).join('');
}

/**
 * Initialize trouble ticket management
 */
function initTroubleTicketManagement() {
    // Add trouble ticket status update handlers
    const statusButtons = document.querySelectorAll('[data-ticket-status]');
    statusButtons.forEach(button => {
        button.addEventListener('click', handleTicketStatusUpdate);
    });
}

/**
 * Handle ticket status update
 */
function handleTicketStatusUpdate(event) {
    const button = event.currentTarget;
    const ticketId = button.dataset.ticketId;
    const newStatus = button.dataset.ticketStatus;
    
    if (confirm(`Update ticket status to ${newStatus}?`)) {
        updateTicketStatus(ticketId, newStatus);
    }
}

/**
 * Update ticket status
 */
async function updateTicketStatus(ticketId, status) {
    try {
        const response = await fetch(`/technician/troubletickets/${ticketId}/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: status,
                technician_notes: ''
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Ticket status updated successfully', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            showNotification('Failed to update ticket: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error updating ticket status:', error);
        showNotification('Error updating ticket', 'error');
    }
}

/**
 * Initialize device monitoring
 */
function initDeviceMonitoring() {
    // Add device status refresh
    const refreshButton = document.getElementById('refresh-devices');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshDeviceStatus);
    }
    
    // Auto refresh every 30 seconds
    setInterval(refreshDeviceStatus, 30000);
}

/**
 * Refresh device status
 */
async function refreshDeviceStatus() {
    try {
        const response = await fetch('/technician/api/statistics');
        const result = await response.json();
        
        if (result.success) {
            updateDeviceStats(result.data);
        }
    } catch (error) {
        console.error('Error refreshing device status:', error);
    }
}

/**
 * Update device statistics
 */
function updateDeviceStats(data) {
    const totalDevices = document.getElementById('total-devices');
    const onlineDevices = document.getElementById('online-devices');
    const offlineDevices = document.getElementById('offline-devices');
    
    if (totalDevices) totalDevices.textContent = data.totalDevices;
    if (onlineDevices) onlineDevices.textContent = data.onlineDevices;
    if (offlineDevices) offlineDevices.textContent = data.offlineDevices;
}

/**
 * Add touch feedback for interactive elements
 */
function addTouchFeedback() {
    const interactiveElements = document.querySelectorAll('.tech-menu-card, .tech-action-btn, .tech-stat-card, .tech-nav-item');
    
    interactiveElements.forEach(element => {
        // Touch start
        element.addEventListener('touchstart', function(e) {
            this.style.transform = 'translateY(-2px) scale(0.98)';
            this.style.transition = 'all 0.1s ease';
            
            // Add haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
        });
        
        // Touch end
        element.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = '';
                this.style.transition = 'all 0.3s ease';
            }, 150);
        });
        
        // Touch cancel
        element.addEventListener('touchcancel', function() {
            this.style.transform = '';
            this.style.transition = 'all 0.3s ease';
        });
    });
}

/**
 * Initialize haptic feedback
 */
function initHapticFeedback() {
    if (!navigator.vibrate) {
        console.log('Haptic feedback not supported on this device');
        return;
    }
    
    // Different vibration patterns for different actions
    const vibrationPatterns = {
        success: [100, 50, 100],
        error: [200, 100, 200],
        warning: [150, 75, 150],
        info: [50, 25, 50]
    };
    
    // Add haptic feedback to action buttons
    const actionButtons = document.querySelectorAll('.tech-action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            navigator.vibrate(vibrationPatterns.info);
        });
    });
    
    // Add haptic feedback to menu cards
    const menuCards = document.querySelectorAll('.tech-menu-card');
    menuCards.forEach(card => {
        card.addEventListener('click', function() {
            navigator.vibrate(vibrationPatterns.success);
        });
    });
}

/**
 * Initialize pull-to-refresh functionality
 */
function initPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let isRefreshing = false;
    const refreshThreshold = 100;
    
    document.addEventListener('touchstart', function(e) {
        if (window.scrollY === 0) {
            startY = e.touches[0].clientY;
        }
    });
    
    document.addEventListener('touchmove', function(e) {
        if (window.scrollY === 0 && startY > 0) {
            currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;
            
            if (pullDistance > 0) {
                e.preventDefault();
                
                // Add visual feedback
                const pullDistancePercent = Math.min(pullDistance / refreshThreshold, 1);
                document.body.style.transform = `translateY(${pullDistance * 0.5}px)`;
                document.body.style.opacity = 1 - (pullDistancePercent * 0.1);
                
                // Show refresh indicator
                showRefreshIndicator(pullDistancePercent);
            }
        }
    });
    
    document.addEventListener('touchend', function(e) {
        if (startY > 0) {
            const pullDistance = currentY - startY;
            
            if (pullDistance > refreshThreshold && !isRefreshing) {
                triggerRefresh();
            } else {
                // Reset position
                document.body.style.transform = '';
                document.body.style.opacity = '';
                hideRefreshIndicator();
            }
            
            startY = 0;
            currentY = 0;
        }
    });
}

/**
 * Show refresh indicator
 */
function showRefreshIndicator(progress) {
    let indicator = document.getElementById('tech-refresh-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'tech-refresh-indicator';
        indicator.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Pull to refresh';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(16, 185, 129, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 9999;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(indicator);
    }
    
    indicator.style.opacity = progress;
    indicator.style.transform = `translateX(-50%) scale(${0.8 + progress * 0.2})`;
}

/**
 * Hide refresh indicator
 */
function hideRefreshIndicator() {
    const indicator = document.getElementById('tech-refresh-indicator');
    if (indicator) {
        indicator.style.opacity = '0';
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 300);
    }
}

/**
 * Trigger refresh
 */
function triggerRefresh() {
    isRefreshing = true;
    
    // Show loading state
    const indicator = document.getElementById('tech-refresh-indicator');
    if (indicator) {
        indicator.innerHTML = '<i class="bi bi-arrow-clockwise spinner"></i> Refreshing...';
    }
    
    // Simulate refresh (in real app, this would reload data)
    setTimeout(() => {
        location.reload();
    }, 1000);
}

/**
 * Initialize quick actions
 */
function initQuickActions() {
    // Quick Add Customer
    window.quickAddCustomer = function() {
        showQuickModal('Tambah Pelanggan', 'customer-form');
    };
    
    // Quick Create Invoice
    window.quickCreateInvoice = function() {
        showQuickModal('Buat Tagihan', 'invoice-form');
    };
    
    // Quick Payment
    window.quickPayment = function() {
        showQuickModal('Input Pembayaran', 'payment-form');
    };
    
    // Quick Report
    window.quickReport = function() {
        showQuickModal('Laporan Cepat', 'report-form');
    };
}

/**
 * Show quick action modal
 */
function showQuickModal(title, formType) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 20px;
        max-width: 400px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    
    modal.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">${title}</h5>
            <button class="btn-close" onclick="closeQuickModal()"></button>
        </div>
        <div id="quick-form-content">
            <p class="text-muted">Fitur ${title} akan segera tersedia. Redirect ke halaman lengkap...</p>
            <div class="d-grid gap-2 mt-3">
                <button class="btn btn-primary" onclick="redirectToFullPage('${formType}')">
                    Buka Halaman Lengkap
                </button>
                <button class="btn btn-outline-secondary" onclick="closeQuickModal()">
                    Batal
                </button>
            </div>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add animation
    overlay.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 10);
    
    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeQuickModal();
        }
    });
    
    // Store reference for closing
    window.currentQuickModal = overlay;
}

/**
 * Close quick modal
 */
function closeQuickModal() {
    const overlay = window.currentQuickModal;
    if (overlay) {
        overlay.style.opacity = '0';
        const modal = overlay.querySelector('div');
        modal.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
        
        window.currentQuickModal = null;
    }
}

/**
 * Redirect to full page
 */
function redirectToFullPage(formType) {
    const routes = {
        'customer-form': '/technician/customers?action=add',
        'invoice-form': '/technician/payments?action=create',
        'payment-form': '/technician/payments?action=input',
        'report-form': '/technician/dashboard'
    };
    
    const route = routes[formType];
    if (route) {
        window.location.href = route;
    }
}

/**
 * Create ripple effect for button clicks
 */
function createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(16, 185, 129, 0.3)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.pointerEvents = 'none';
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Update active navigation state
 */
function updateActiveNavigation() {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.tech-nav-item');
    
    navItems.forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('href');
        
        if (currentPath.includes(href.replace('/technician', ''))) {
            item.classList.add('active');
        }
    });
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `tech-mobile-notification ${type}`;
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-${getNotificationIcon(type)} me-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * Get notification icon
 */
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-triangle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Add CSS for ripple animation
 */
const rippleCSS = `
@keyframes ripple {
    0% {
        transform: scale(0);
        opacity: 1;
    }
    100% {
        transform: scale(2);
        opacity: 0;
    }
}

.spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

/**
 * Performance optimization
 */
function optimizePerformance() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Debounce scroll events
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Handle scroll events here
        }, 100);
    });
}

// Initialize performance optimizations
optimizePerformance();

/**
 * Error handling
 */
window.addEventListener('error', function(e) {
    console.error('Technician Mobile Error:', e.error);
    
    // Show user-friendly error message
    if (e.error && e.error.message) {
        showNotification('Terjadi kesalahan: ' + e.error.message, 'error');
    }
});

console.log('Technician Mobile JavaScript loaded successfully!');

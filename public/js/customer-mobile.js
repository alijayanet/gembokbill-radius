/**
 * Customer Mobile Enhancement JavaScript
 * Optimized for mobile customer billing portal
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        
        // Initialize mobile enhancements
        initMobileEnhancements();
        
        // Initialize touch interactions
        initTouchInteractions();
        
        // Initialize mobile navigation
        initMobileNavigation();
        
        // Initialize mobile tables
        initMobileTables();
        
        // Initialize mobile forms
        initMobileForms();
    });

    /**
     * Initialize mobile enhancements
     */
    function initMobileEnhancements() {
        
        // Add mobile-specific classes
        if (window.innerWidth <= 768) {
            document.body.classList.add('mobile-device');
        }
        
        // Handle orientation change
        window.addEventListener('orientationchange', function() {
            setTimeout(function() {
                if (window.innerWidth <= 768) {
                    document.body.classList.add('mobile-device');
                } else {
                    document.body.classList.remove('mobile-device');
                }
            }, 100);
        });
        
        // Handle resize
        window.addEventListener('resize', function() {
            if (window.innerWidth <= 768) {
                document.body.classList.add('mobile-device');
            } else {
                document.body.classList.remove('mobile-device');
            }
        });
    }

    /**
     * Initialize touch interactions
     */
    function initTouchInteractions() {
        
        // Add touch feedback to buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(function(button) {
            button.addEventListener('touchstart', function() {
                this.classList.add('touching');
            });
            
            button.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.classList.remove('touching');
                }, 150);
            });
        });
        
        // Add touch feedback to cards
        const cards = document.querySelectorAll('.card');
        cards.forEach(function(card) {
            if (card.querySelector('a, .btn')) {
                card.addEventListener('touchstart', function() {
                    this.classList.add('touching');
                });
                
                card.addEventListener('touchend', function() {
                    setTimeout(() => {
                        this.classList.remove('touching');
                    }, 150);
                });
            }
        });
    }

    /**
     * Initialize mobile navigation
     */
    function initMobileNavigation() {
        
        // Handle bottom navigation active states
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        
        navItems.forEach(function(navItem) {
            const href = navItem.getAttribute('href');
            if (currentPath.includes(href) || 
                (currentPath === '/customer/billing/dashboard' && href === '/customer/billing/dashboard') ||
                (currentPath.includes('/customer/billing/invoices') && href === '/customer/billing/invoices') ||
                (currentPath.includes('/customer/billing/profile') && href === '/customer/billing/profile')) {
                navItem.classList.add('active');
            }
        });
        
        // Add click feedback to navigation items
        navItems.forEach(function(navItem) {
            navItem.addEventListener('touchstart', function() {
                this.classList.add('nav-touching');
            });
            
            navItem.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.classList.remove('nav-touching');
                }, 150);
            });
        });
        
        // Special handling for home button
        const homeButton = document.querySelector('.nav-item.home-button');
        if (homeButton) {
            // Add pulsing animation when page loads
            setTimeout(() => {
                homeButton.style.animation = 'pulse-home 2s ease-in-out 2';
            }, 1000);
            
            // Add special click effect with haptic feedback
            homeButton.addEventListener('touchstart', function(e) {
                this.style.transform = 'translateY(-2px) scale(0.95)';
                this.style.boxShadow = '0 2px 10px rgba(102, 126, 234, 0.6)';
                
                // Haptic feedback if supported
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                // Add ripple effect
                createRippleEffect(e, this);
            });
            
            homeButton.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.style.transform = 'translateY(-4px) scale(1)';
                    this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.4)';
                }, 150);
            });
            
            // Add hover effect for desktop
            homeButton.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-6px)';
                this.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
            });
            
            homeButton.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(-4px)';
                this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.4)';
            });
            
            // Add click effect for mouse
            homeButton.addEventListener('click', function(e) {
                // Add ripple effect for mouse clicks too
                createRippleEffect(e, this);
            });
        }
    }

    /**
     * Initialize mobile tables
     */
    function initMobileTables() {
        
        // Convert tables to mobile-friendly format on small screens
        const tables = document.querySelectorAll('.table-responsive table');
        
        if (window.innerWidth <= 768) {
            tables.forEach(function(table) {
                convertTableToMobile(table);
            });
        }
        
        // Handle window resize for tables
        window.addEventListener('resize', function() {
            if (window.innerWidth <= 768) {
                tables.forEach(function(table) {
                    if (!table.classList.contains('mobile-converted')) {
                        convertTableToMobile(table);
                    }
                });
            }
        });
    }

    /**
     * Convert table to mobile-friendly format
     */
    function convertTableToMobile(table) {
        
        if (table.classList.contains('mobile-converted')) {
            return;
        }
        
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(function(row) {
            const cells = row.querySelectorAll('td');
            const headers = table.querySelectorAll('th');
            
            cells.forEach(function(cell, index) {
                if (headers[index]) {
                    cell.setAttribute('data-label', headers[index].textContent);
                }
            });
        });
        
        table.classList.add('mobile-converted');
    }

    /**
     * Initialize mobile forms
     */
    function initMobileForms() {
        
        // Prevent zoom on input focus (iOS)
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(function(input) {
            if (input.type !== 'range' && input.type !== 'checkbox' && input.type !== 'radio') {
                input.addEventListener('focus', function() {
                    if (window.innerWidth <= 768) {
                        // Add viewport meta tag adjustment if needed
                        const viewport = document.querySelector('meta[name="viewport"]');
                        if (viewport) {
                            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                        }
                    }
                });
                
                input.addEventListener('blur', function() {
                    // Restore normal viewport
                    const viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
                    }
                });
            }
        });
        
        // Add loading states to forms
        const forms = document.querySelectorAll('form');
        forms.forEach(function(form) {
            form.addEventListener('submit', function() {
                const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Loading...';
                }
            });
        });
    }

    /**
     * Show mobile-friendly toast notification
     */
    function showMobileToast(message, type = 'info') {
        
        const toast = document.createElement('div');
        toast.className = `mobile-toast mobile-toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="bi bi-${getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Get icon for toast type
     */
    function getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Handle logout confirmation
     */
    function confirmLogout(event) {
        event.preventDefault();
        
        if (window.confirm('Apakah Anda yakin ingin keluar dari akun Anda?')) {
            window.location.href = event.target.href;
        }
    }

    /**
     * Initialize logout buttons
     */
    function initLogoutButtons() {
        const logoutButtons = document.querySelectorAll('a[href*="logout"]');
        logoutButtons.forEach(function(button) {
            button.addEventListener('click', confirmLogout);
        });
    }

    // Initialize logout buttons
    initLogoutButtons();

    /**
     * Handle pull-to-refresh (mobile)
     */
    function initPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let isRefreshing = false;
        
        document.addEventListener('touchstart', function(e) {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        });
        
        document.addEventListener('touchmove', function(e) {
            if (window.scrollY === 0 && !isRefreshing) {
                currentY = e.touches[0].clientY;
                const diff = currentY - startY;
                
                if (diff > 100) {
                    // Trigger refresh
                    isRefreshing = true;
                    showMobileToast('Memuat ulang halaman...', 'info');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            }
        });
    }

    // Initialize pull-to-refresh on mobile
    if (window.innerWidth <= 768) {
        initPullToRefresh();
    }

    /**
     * Handle mobile-specific keyboard events
     */
    function initMobileKeyboard() {
        
        // Handle virtual keyboard appearance
        const initialViewportHeight = window.innerHeight;
        
        window.addEventListener('resize', function() {
            const currentHeight = window.innerHeight;
            const heightDiff = initialViewportHeight - currentHeight;
            
            if (heightDiff > 150) {
                // Virtual keyboard is open
                document.body.classList.add('keyboard-open');
            } else {
                // Virtual keyboard is closed
                document.body.classList.remove('keyboard-open');
            }
        });
    }

    // Initialize mobile keyboard handling
    initMobileKeyboard();

    /**
     * Optimize images for mobile
     */
    function optimizeImagesForMobile() {
        const images = document.querySelectorAll('img');
        
        images.forEach(function(img) {
            // Add loading="lazy" for better performance
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Handle image load errors
            img.addEventListener('error', function() {
                this.style.display = 'none';
            });
        });
    }

    // Optimize images
    optimizeImagesForMobile();

    /**
     * Handle mobile-specific animations
     */
    function initMobileAnimations() {
        
        // Intersection Observer for fade-in animations
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            }, {
                threshold: 0.1
            });
            
            const animateElements = document.querySelectorAll('.card, .btn, .alert');
            animateElements.forEach(function(element) {
                observer.observe(element);
            });
        }
    }

    // Initialize mobile animations
    initMobileAnimations();

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
        ripple.style.background = 'rgba(255, 255, 255, 0.3)';
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

    // Export functions for global use
    window.CustomerMobile = {
        showToast: showMobileToast,
        confirmLogout: confirmLogout,
        createRippleEffect: createRippleEffect
    };

})();

// VATAX - Main JavaScript File
// Netlify compatible fixes applied

// Global state management
window.VATAX = {
    currentUser: null,
    userSession: null,
    isProUser: false,
    calculations: [],
    config: {
        appName: 'VATAX',
        version: '1.0.0',
        apiBaseUrl: '/.netlify/functions/api',
        maxFreeCalculations: 5
    }
};

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    checkUserSession();
    setupEventListeners();
    initializeModals();
    updateNavigationState();
    loadUserPreferences();
}

// Check if user is logged in
function checkUserSession() {
    try {
        const userData = localStorage.getItem('vatax_user');
        const sessionToken = localStorage.getItem('vatax_session');
        
        if (userData && sessionToken) {
            VATAX.currentUser = JSON.parse(userData);
            VATAX.userSession = sessionToken;
            VATAX.isProUser = VATAX.currentUser.subscription_status === 'pro';
            updateUIForLoggedInUser();
        } else {
            updateUIForGuestUser();
        }
    } catch (error) {
        console.error('Session check error:', error);
        updateUIForGuestUser();
    }
}

// Update navigation state based on user login
function updateNavigationState() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (VATAX.currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'block';
            const userName = document.getElementById('user-name');
            if (userName) userName.textContent = VATAX.currentUser.name;
        }
    } else {
        if (authButtons) authButtons.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    if (VATAX.isProUser) {
        enableProFeatures();
    } else {
        disableProFeatures();
    }
    updateUserDashboardData();
}

// Update UI for guest user
function updateUIForGuestUser() {
    disableProFeatures();
    showFreePlanLimits();
}

// Enable pro features
function enableProFeatures() {
    const proFeatureButtons = document.querySelectorAll('[data-pro="true"]');
    proFeatureButtons.forEach(button => {
        button.disabled = false;
        button.style.opacity = '1';
    });
    
    const proSections = document.querySelectorAll('.pro-feature');
    proSections.forEach(section => {
        section.style.display = 'block';
    });
}

// Disable pro features
function disableProFeatures() {
    const proFeatureButtons = document.querySelectorAll('[data-pro="true"]');
    proFeatureButtons.forEach(button => {
        button.disabled = true;
        button.style.opacity = '0.5';
    });
    
    const proSections = document.querySelectorAll('.pro-feature');
    proSections.forEach(section => {
        section.style.display = 'none';
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
    }
    
    // User dropdown
    const userDropdownBtn = document.getElementById('user-dropdown-btn');
    if (userDropdownBtn) {
        userDropdownBtn.addEventListener('click', toggleUserDropdown);
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        closeDropdownsOnOutsideClick(event);
    });
    
    // Form submissions
    setupFormListeners();
}

// Setup form listeners
function setupFormListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
}

// Initialize Modal functionality
function initializeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Authentication Functions
async function handleLogin(event) {
    if (event) event.preventDefault();
    
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    showLoadingSpinner('login-form');
    
    try {
        const response = await simulateLogin(email, password);
        
        if (response.success) {
            localStorage.setItem('vatax_user', JSON.stringify(response.user));
            localStorage.setItem('vatax_session', response.sessionToken);
            
            VATAX.currentUser = response.user;
            VATAX.userSession = response.sessionToken;
            VATAX.isProUser = response.user.subscription_status === 'pro';
            
            updateNavigationState();
            updateUIForLoggedInUser();
            
            closeModal('login-modal');
            showAlert('Login successful! Welcome back.', 'success');
            
            if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        } else {
            showAlert(response.message || 'Login failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('An error occurred during login. Please try again.', 'error');
    } finally {
        hideLoadingSpinner('login-form');
    }
}

async function handleSignup(event) {
    if (event) event.preventDefault();
    
    const name = document.getElementById('signup-name')?.value;
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-password')?.value;
    const termsChecked = document.getElementById('terms-checkbox')?.checked;
    
    if (!name || !email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    if (!termsChecked) {
        showAlert('Please accept the terms of service.', 'warning');
        return;
    }
    
    showLoadingSpinner('signup-form');
    
    try {
        const response = await simulateSignup(name, email, password);
        
        if (response.success) {
            localStorage.setItem('vatax_user', JSON.stringify(response.user));
            localStorage.setItem('vatax_session', response.sessionToken);
            
            VATAX.currentUser = response.user;
            VATAX.userSession = response.sessionToken;
            VATAX.isProUser = false;
            
            updateNavigationState();
            updateUIForLoggedInUser();
            
            closeModal('signup-modal');
            showAlert('Account created successfully! Welcome to VATAX.', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showAlert(response.message || 'Signup failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showAlert('An error occurred during registration. Please try again.', 'error');
    } finally {
        hideLoadingSpinner('signup-form');
    }
}

// Simulate login API call
async function simulateLogin(email, password) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'demo@example.com' && password === 'demo123') {
        return {
            success: true,
            user: {
                id: 'user_001',
                name: 'Demo User',
                email: email,
                subscription_status: 'pro',
                subscription_plan: 'monthly',
                subscription_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                profile_completed: true,
                email_verified: true
            },
            sessionToken: 'session_' + Date.now()
        };
    }
    
    return {
        success: false,
        message: 'Invalid email or password'
    };
}

// Simulate signup API call
async function simulateSignup(name, email, password) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    if (email === 'demo@example.com') {
        return {
            success: false,
            message: 'Email already exists'
        };
    }
    
    return {
        success: true,
        user: {
            id: 'user_' + Date.now(),
            name: name,
            email: email,
            subscription_status: 'free',
            subscription_plan: null,
            subscription_expires: null,
            profile_completed: false,
            email_verified: false
        },
        sessionToken: 'session_' + Date.now()
    };
}

// Logout function
function logout() {
    localStorage.removeItem('vatax_user');
    localStorage.removeItem('vatax_session');
    
    VATAX.currentUser = null;
    VATAX.userSession = null;
    VATAX.isProUser = false;
    
    updateUIForGuestUser();
    updateNavigationState();
    
    showAlert('You have been logged out successfully.', 'info');
    
    if (window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'index.html';
    }
}

// Modal functions
function showLogin() {
    showModal('login-modal');
}

function showSignup() {
    showModal('signup-modal');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Navigation functions
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.style.display = mobileMenu.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleUserDropdown() {
    const dropdownMenu = document.getElementById('dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    }
}

function closeDropdownsOnOutsideClick(event) {
    const userDropdown = document.getElementById('dropdown-menu');
    const userButton = document.getElementById('user-dropdown-btn');
    
    if (userDropdown && userButton && !userDropdown.contains(event.target) && !userButton.contains(event.target)) {
        userDropdown.style.display = 'none';
    }
}

// Utility functions
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div style="display: flex; align-items: center; padding: 12px; background: ${getAlertColor(type)}; color: white; border-radius: 4px; margin: 10px; max-width: 400px;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
        </div>
    `;
    
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '1000';
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

function getAlertColor(type) {
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    return colors[type] || '#3B82F6';
}

function showLoadingSpinner(formId) {
    const form = document.getElementById(formId);
    const submitButton = form?.querySelector('button[type="submit"]');
    
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = 'Loading...';
    }
}

function hideLoadingSpinner(formId) {
    const form = document.getElementById(formId);
    const submitButton = form?.querySelector('button[type="submit"]');
    
    if (submitButton) {
        submitButton.disabled = false;
        if (formId === 'login-form') {
            submitButton.innerHTML = 'Login';
        } else if (formId === 'signup-form') {
            submitButton.innerHTML = 'Create Account';
        }
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount).replace('BDT', '৳');
}

// Format number with commas
function formatNumber(number) {
    return new Intl.NumberFormat('en-BD').format(number);
}

// Load user preferences
function loadUserPreferences() {
    try {
        const preferences = localStorage.getItem('vatax_preferences');
        if (preferences) {
            const prefs = JSON.parse(preferences);
            applyThemePreferences(prefs);
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

function applyThemePreferences(preferences) {
    if (preferences.theme === 'dark') {
        document.body.classList.add('dark');
    }
}

// Update dashboard data
function updateUserDashboardData() {
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboardData();
    }
}

async function loadDashboardData() {
    try {
        const calculations = await loadUserCalculations();
        const stats = await loadUserStatistics();
        updateDashboardStats(stats);
        updateRecentCalculations(calculations);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadUserCalculations() {
    return [
        {
            id: 'calc_001',
            type: 'vat',
            baseAmount: 50000,
            vatRate: 15,
            totalAmount: 57500,
            date: new Date().toISOString(),
            saved: true
        }
    ];
}

async function loadUserStatistics() {
    return {
        totalCalculations: 247,
        vatCalculations: 156,
        taxCalculations: 91,
        reportsGenerated: 23
    };
}

function updateDashboardStats(stats) {
    const elements = {
        'total-calculations': stats.totalCalculations,
        'vat-calculations': stats.vatCalculations,
        'tax-calculations': stats.taxCalculations,
        'reports-generated': stats.reportsGenerated
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = formatNumber(value);
        }
    });
}

function updateRecentCalculations(calculations) {
    const tableBody = document.getElementById('calculations-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = calculations.map(calc => `
        <tr>
            <td>
                <div style="display: flex; align-items: center;">
                    ${calc.type === 'vat' ? 'VAT' : 'Income Tax'}
                </div>
            </td>
            <td>${formatCurrency(calc.baseAmount)}</td>
            <td style="font-weight: 600;">${formatCurrency(calc.totalAmount || calc.baseAmount + calc.taxAmount)}</td>
            <td>${new Date(calc.date).toLocaleDateString()}</td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="view-btn" title="View Details">View</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Show free plan limits
function showFreePlanLimits() {
    const calculationCount = parseInt(localStorage.getItem('vatax_free_calculations') || '0');
    
    if (calculationCount >= VATAX.config.maxFreeCalculations) {
        showAlert('You have reached the limit of free calculations. Upgrade to Pro for unlimited access.', 'warning');
    }
}

// Track free calculations
function trackFreeCalculation() {
    if (!VATAX.currentUser || VATAX.currentUser.subscription_status === 'free') {
        const currentCount = parseInt(localStorage.getItem('vatax_free_calculations') || '0');
        localStorage.setItem('vatax_free_calculations', (currentCount + 1).toString());
        
        if (currentCount + 1 >= VATAX.config.maxFreeCalculations) {
            showAlert('You have reached your free calculation limit. Upgrade to Pro for unlimited calculations.', 'warning');
        }
    }
}

// Quick calculator functions for homepage
function calculateQuickVAT() {
    const amountInput = document.getElementById('quick-vat-amount');
    const rateInput = document.getElementById('quick-vat-rate');
    
    if (!amountInput || !rateInput) return;
    
    const amount = parseFloat(amountInput.value);
    const rate = parseFloat(rateInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        showAlert('Please enter a valid amount', 'warning');
        return;
    }
    
    const vatAmount = (amount * rate) / 100;
    const total = amount + vatAmount;
    
    const amountResult = document.getElementById('quick-vat-amount-result');
    const totalResult = document.getElementById('quick-vat-total-result');
    const resultDiv = document.getElementById('quick-vat-result');
    
    if (amountResult) amountResult.textContent = formatNumber(vatAmount);
    if (totalResult) totalResult.textContent = formatNumber(total);
    if (resultDiv) resultDiv.style.display = 'block';
    
    trackFreeCalculation();
}

function calculateQuickTax() {
    const incomeInput = document.getElementById('quick-tax-income');
    if (!incomeInput) return;
    
    const income = parseFloat(incomeInput.value);
    
    if (isNaN(income) || income <= 0) {
        showAlert('Please enter a valid income amount', 'warning');
        return;
    }
    
    const taxCalculation = calculateIncomeTax(income, 'individual', '2024-25');
    
    const taxableIncomeEl = document.getElementById('quick-taxable-income');
    const taxAmountEl = document.getElementById('quick-tax-amount');
    const resultDiv = document.getElementById('quick-tax-result');
    
    if (taxableIncomeEl) taxableIncomeEl.textContent = formatNumber(taxCalculation.taxableIncome);
    if (taxAmountEl) taxAmountEl.textContent = formatNumber(taxCalculation.totalTax);
    if (resultDiv) resultDiv.style.display = 'block';
    
    trackFreeCalculation();
}

// Basic income tax calculation function
function calculateIncomeTax(income, category = 'individual', year = '2024-25') {
    const taxSlabs = {
        individual: [
            { min: 0, max: 350000, rate: 0 },
            { min: 350000, max: 450000, rate: 5 },
            { min: 450000, max: 750000, rate: 10 },
            { min: 750000, max: 1150000, rate: 15 },
            { min: 1150000, max: 1650000, rate: 20 },
            { min: 1650000, max: Infinity, rate: 25 }
        ]
    };
    
    const slabs = taxSlabs[category] || taxSlabs.individual;
    let totalTax = 0;
    let remainingIncome = income;
    
    for (const slab of slabs) {
        if (remainingIncome <= 0) break;
        
        const taxableInThisSlab = Math.min(remainingIncome, slab.max - slab.min);
        const taxForThisSlab = (taxableInThisSlab * slab.rate) / 100;
        
        totalTax += taxForThisSlab;
        remainingIncome -= taxableInThisSlab;
        
        if (income <= slab.max) break;
    }
    
    return {
        taxableIncome: income,
        totalTax: Math.round(totalTax),
        effectiveRate: income > 0 ? (totalTax / income) * 100 : 0
    };
}

// Netlify-specific fixes for SPA routing
function setupSPARouting() {
    // Handle internal links for SPA behavior
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && link.href.startsWith(window.location.origin)) {
            e.preventDefault();
            const path = new URL(link.href).pathname;
            navigateTo(path);
        }
    });
}

function navigateTo(path) {
    // Simple SPA navigation
    window.history.pushState({}, '', path);
    loadPageContent(path);
}

function loadPageContent(path) {
    // Simple content loading for SPA
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `<div style="padding: 20px; text-align: center;">Loading ${path}...</div>`;
        
        // Simulate content loading
        setTimeout(() => {
            if (path.includes('dashboard')) {
                initializeDashboard();
            } else if (path.includes('vat-calculator')) {
                initializeVATCalculator();
            } else if (path.includes('tax-calculator')) {
                initializeTaxCalculator();
            }
        }, 300);
    }
}

// Initialize SPA routing
document.addEventListener('DOMContentLoaded', function() {
    setupSPARouting();
});

// Export functions to global scope
window.showLogin = showLogin;
window.showSignup = showSignup;
window.closeModal = closeModal;
window.logout = logout;
window.toggleMobileMenu = toggleMobileMenu;
window.calculateQuickVAT = calculateQuickVAT;
window.calculateQuickTax = calculateQuickTax;
window.VATAX = window.VATAX || VATAX;

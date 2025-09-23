// VATAX - Main JavaScript File
// Core functionality for authentication, navigation, and UI interactions

// Global state management
window.VATAX = {
    currentUser: null,
    userSession: null,
    isProUser: false,
    calculations: [],
    config: {
        appName: 'VATAX',
        version: '1.0.0',
        apiBaseUrl: '/api',
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
}

// Update navigation state based on user login
function updateNavigationState() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (VATAX.currentUser) {
        if (authButtons) authButtons.classList.add('hidden');
        if (userMenu) {
            userMenu.classList.remove('hidden');
            const userName = document.getElementById('user-name');
            if (userName) userName.textContent = VATAX.currentUser.name;
        }
    } else {
        if (authButtons) authButtons.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    // Enable pro features if user is pro
    if (VATAX.isProUser) {
        enableProFeatures();
    } else {
        disableProFeatures();
    }
    
    // Update user-specific content
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
        button.classList.remove('opacity-50');
    });
    
    // Show pro sections
    const proSections = document.querySelectorAll('.pro-feature');
    proSections.forEach(section => {
        section.classList.remove('hidden');
    });
}

// Disable pro features
function disableProFeatures() {
    const proFeatureButtons = document.querySelectorAll('[data-pro="true"]');
    proFeatureButtons.forEach(button => {
        button.disabled = true;
        button.classList.add('opacity-50');
    });
    
    // Hide pro sections
    const proSections = document.querySelectorAll('.pro-feature');
    proSections.forEach(section => {
        section.classList.add('hidden');
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuButton = document.querySelector('[onclick="toggleMobileMenu()"]');
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
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
}

// Initialize Modal functionality
function initializeModals() {
    // Close modal when clicking outside
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
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    showLoadingSpinner('login-form');
    
    try {
        // Simulate API call - replace with actual authentication
        const response = await simulateLogin(email, password);
        
        if (response.success) {
            // Store user data
            localStorage.setItem('vatax_user', JSON.stringify(response.user));
            localStorage.setItem('vatax_session', response.sessionToken);
            
            // Update global state
            VATAX.currentUser = response.user;
            VATAX.userSession = response.sessionToken;
            VATAX.isProUser = response.user.subscription_status === 'pro';
            
            // Update UI
            updateNavigationState();
            updateUIForLoggedInUser();
            
            closeModal('login-modal');
            showAlert('Login successful! Welcome back.', 'success');
            
            // Redirect to dashboard if on homepage
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
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const termsChecked = document.getElementById('terms-checkbox').checked;
    
    if (!termsChecked) {
        showAlert('Please accept the terms of service.', 'warning');
        return;
    }
    
    showLoadingSpinner('signup-form');
    
    try {
        // Simulate API call - replace with actual registration
        const response = await simulateSignup(name, email, password);
        
        if (response.success) {
            // Store user data
            localStorage.setItem('vatax_user', JSON.stringify(response.user));
            localStorage.setItem('vatax_session', response.sessionToken);
            
            // Update global state
            VATAX.currentUser = response.user;
            VATAX.userSession = response.sessionToken;
            VATAX.isProUser = false; // New users start with free plan
            
            // Update UI
            updateNavigationState();
            updateUIForLoggedInUser();
            
            closeModal('signup-modal');
            showAlert('Account created successfully! Welcome to VATAX.', 'success');
            
            // Redirect to dashboard
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

// Simulate login API call (replace with real API)
async function simulateLogin(email, password) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Demo user for testing
    if (email === 'john@example.com' && password === 'demo123') {
        return {
            success: true,
            user: {
                id: 'user_001',
                name: 'John Doe',
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

// Simulate signup API call (replace with real API)
async function simulateSignup(name, email, password) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Check if email already exists (simple simulation)
    if (email === 'john@example.com') {
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
    
    // Redirect to homepage if on dashboard
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
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('fade-in');
        document.body.style.overflow = 'auto';
    }
}

// Navigation functions
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

function toggleUserDropdown() {
    const dropdownMenu = document.getElementById('dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.classList.toggle('hidden');
    }
}

function closeDropdownsOnOutsideClick(event) {
    const userDropdown = document.getElementById('dropdown-menu');
    const userButton = document.getElementById('user-dropdown-btn');
    
    if (userDropdown && !userDropdown.contains(event.target) && !userButton.contains(event.target)) {
        userDropdown.classList.add('hidden');
    }
}

// Utility functions
function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} fixed top-20 right-4 z-50 max-w-sm`;
    alert.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${getAlertIcon(type)} mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-xl">×</button>
        </div>
    `;
    
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

function getAlertIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function showLoadingSpinner(formId) {
    const form = document.getElementById(formId);
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
    }
}

function hideLoadingSpinner(formId) {
    const form = document.getElementById(formId);
    const submitButton = form.querySelector('button[type="submit"]');
    
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
    const preferences = localStorage.getItem('vatax_preferences');
    if (preferences) {
        const prefs = JSON.parse(preferences);
        // Apply user preferences
        applyThemePreferences(prefs);
    }
}

function applyThemePreferences(preferences) {
    // Apply theme, language, etc.
    if (preferences.theme === 'dark') {
        document.body.classList.add('dark-theme');
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
        // Load user calculations, statistics, etc.
        const calculations = await loadUserCalculations();
        const stats = await loadUserStatistics();
        
        // Update dashboard UI with loaded data
        updateDashboardStats(stats);
        updateRecentCalculations(calculations);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadUserCalculations() {
    // Simulate API call to load user calculations
    return [
        {
            id: 'calc_001',
            type: 'vat',
            baseAmount: 50000,
            vatRate: 15,
            totalAmount: 57500,
            date: new Date().toISOString(),
            saved: true
        },
        {
            id: 'calc_002',
            type: 'income_tax',
            baseAmount: 800000,
            taxAmount: 78500,
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            saved: true
        }
    ];
}

async function loadUserStatistics() {
    // Simulate API call to load user statistics
    return {
        totalCalculations: 247,
        vatCalculations: 156,
        taxCalculations: 91,
        reportsGenerated: 23
    };
}

function updateDashboardStats(stats) {
    // Update statistics on dashboard page
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
                <div class="flex items-center">
                    <i class="fas fa-${calc.type === 'vat' ? 'percentage' : 'coins'} 
                       text-${calc.type === 'vat' ? 'orange' : 'green'} mr-2"></i>
                    ${calc.type === 'vat' ? 'VAT' : 'Income Tax'}
                </div>
            </td>
            <td>${formatCurrency(calc.baseAmount)}</td>
            <td class="font-semibold">${formatCurrency(calc.totalAmount || calc.baseAmount + calc.taxAmount)}</td>
            <td>${new Date(calc.date).toLocaleDateString()}</td>
            <td>
                <div class="flex space-x-2">
                    <button class="text-green hover:text-green-dark" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-orange hover:text-orange-dark" title="Download PDF">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="text-navy hover:text-navy-dark" title="Email Report">
                        <i class="fas fa-envelope"></i>
                    </button>
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
    const amount = parseFloat(document.getElementById('quick-vat-amount').value);
    const rate = parseFloat(document.getElementById('quick-vat-rate').value);
    
    if (isNaN(amount) || amount <= 0) {
        showAlert('Please enter a valid amount', 'warning');
        return;
    }
    
    const vatAmount = (amount * rate) / 100;
    const total = amount + vatAmount;
    
    document.getElementById('quick-vat-amount-result').textContent = formatNumber(vatAmount);
    document.getElementById('quick-vat-total-result').textContent = formatNumber(total);
    document.getElementById('quick-vat-result').classList.remove('hidden');
    
    // Track calculation
    trackFreeCalculation();
}

function calculateQuickTax() {
    const income = parseFloat(document.getElementById('quick-tax-income').value);
    
    if (isNaN(income) || income <= 0) {
        showAlert('Please enter a valid income amount', 'warning');
        return;
    }
    
    const taxCalculation = calculateIncomeTax(income, 'individual', '2024-25');
    
    document.getElementById('quick-taxable-income').textContent = formatNumber(taxCalculation.taxableIncome);
    document.getElementById('quick-tax-amount').textContent = formatNumber(taxCalculation.totalTax);
    document.getElementById('quick-tax-result').classList.remove('hidden');
    
    // Track calculation
    trackFreeCalculation();
}

// Basic income tax calculation function
function calculateIncomeTax(income, category = 'individual', year = '2024-25') {
    // Tax slabs for different categories (2024-25)
    const taxSlabs = {
        individual: [
            { min: 0, max: 350000, rate: 0 },
            { min: 350000, max: 450000, rate: 5 },
            { min: 450000, max: 750000, rate: 10 },
            { min: 750000, max: 1150000, rate: 15 },
            { min: 1150000, max: 1650000, rate: 20 },
            { min: 1650000, max: Infinity, rate: 25 }
        ],
        female: [
            { min: 0, max: 400000, rate: 0 },
            { min: 400000, max: 500000, rate: 5 },
            { min: 500000, max: 800000, rate: 10 },
            { min: 800000, max: 1200000, rate: 15 },
            { min: 1200000, max: 1700000, rate: 20 },
            { min: 1700000, max: Infinity, rate: 25 }
        ],
        senior: [
            { min: 0, max: 450000, rate: 0 },
            { min: 450000, max: 550000, rate: 5 },
            { min: 550000, max: 850000, rate: 10 },
            { min: 850000, max: 1250000, rate: 15 },
            { min: 1250000, max: 1750000, rate: 20 },
            { min: 1750000, max: Infinity, rate: 25 }
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

// Export functions to global scope
window.showLogin = showLogin;
window.showSignup = showSignup;
window.closeModal = closeModal;
window.logout = logout;
window.toggleMobileMenu = toggleMobileMenu;
window.calculateQuickVAT = calculateQuickVAT;
window.calculateQuickTax = calculateQuickTax;
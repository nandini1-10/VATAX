// VATAX - Fixed Main JavaScript for Netlify
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

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    checkUserSession();
    setupEventListeners();
    initializeModals();
    updateNavigationState();
    
    // Initialize calculators based on current page
    if (window.location.pathname.includes('vat-calculator.html') || document.getElementById('vat-calculator-section')) {
        setTimeout(initializeVATCalculator, 100);
    }
    if (window.location.pathname.includes('tax-calculator.html') || document.getElementById('tax-calculator-section')) {
        setTimeout(initializeTaxCalculator, 100);
    }
    if (window.location.pathname.includes('pricing.html') || document.getElementById('pricing-section')) {
        setTimeout(initializePricingPage, 100);
    }
    if (window.location.pathname.includes('dashboard.html') || document.getElementById('dashboard-content')) {
        setTimeout(initializeDashboard, 100);
    }
}

// Authentication Functions - FIXED
async function handleLogin(event) {
    if (event) event.preventDefault();
    
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = 'Logging in...';
        submitBtn.disabled = true;
    }
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Demo login - always success for testing
        const userData = {
            id: 'user_' + Date.now(),
            name: email.split('@')[0],
            email: email,
            subscription_status: 'free',
            subscription_plan: null,
            subscription_expires: null,
            profile_completed: true,
            email_verified: true
        };
        
        localStorage.setItem('vatax_user', JSON.stringify(userData));
        localStorage.setItem('vatax_session', 'session_' + Date.now());
        
        VATAX.currentUser = userData;
        VATAX.userSession = 'session_' + Date.now();
        VATAX.isProUser = false;
        
        updateNavigationState();
        updateUIForLoggedInUser();
        
        closeModal('login-modal');
        showAlert('Login successful! Welcome to VATAX.', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        showAlert('Login failed. Please try again.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = 'Login';
            submitBtn.disabled = false;
        }
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
    
    // Show loading
    const submitBtn = document.querySelector('#signup-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = 'Creating Account...';
        submitBtn.disabled = true;
    }
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const userData = {
            id: 'user_' + Date.now(),
            name: name,
            email: email,
            subscription_status: 'free',
            subscription_plan: null,
            subscription_expires: null,
            profile_completed: false,
            email_verified: false
        };
        
        localStorage.setItem('vatax_user', JSON.stringify(userData));
        localStorage.setItem('vatax_session', 'session_' + Date.now());
        
        VATAX.currentUser = userData;
        VATAX.userSession = 'session_' + Date.now();
        VATAX.isProUser = false;
        
        updateNavigationState();
        updateUIForLoggedInUser();
        
        closeModal('signup-modal');
        showAlert('Account created successfully! Welcome to VATAX.', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        showAlert('Signup failed. Please try again.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = 'Create Account';
            submitBtn.disabled = false;
        }
    }
}

// Calculator Functions - FIXED
function calculateQuickVAT() {
    const amountInput = document.getElementById('quick-vat-amount');
    const rateInput = document.getElementById('quick-vat-rate');
    
    if (!amountInput || !rateInput) {
        showAlert('Calculator elements not found', 'error');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    const rate = parseFloat(rateInput.value) || 15;
    
    if (isNaN(amount) || amount <= 0) {
        showAlert('Please enter a valid amount', 'warning');
        return;
    }
    
    const vatAmount = (amount * rate) / 100;
    const total = amount + vatAmount;
    
    // Update results - FIXED SELECTORS
    const amountResult = document.getElementById('quick-vat-amount-result');
    const totalResult = document.getElementById('quick-vat-total-result');
    const resultDiv = document.getElementById('quick-vat-result');
    
    if (amountResult) amountResult.textContent = formatNumber(vatAmount);
    if (totalResult) totalResult.textContent = formatNumber(total);
    if (resultDiv) resultDiv.style.display = 'block';
    
    showAlert(`VAT calculated: ৳${formatNumber(vatAmount)}`, 'success');
}

function calculateQuickTax() {
    const incomeInput = document.getElementById('quick-tax-income');
    if (!incomeInput) return;
    
    const income = parseFloat(incomeInput.value);
    
    if (isNaN(income) || income <= 0) {
        showAlert('Please enter a valid income amount', 'warning');
        return;
    }
    
    const tax = calculateIncomeTax(income);
    
    const taxableIncomeEl = document.getElementById('quick-taxable-income');
    const taxAmountEl = document.getElementById('quick-tax-amount');
    const resultDiv = document.getElementById('quick-tax-result');
    
    if (taxableIncomeEl) taxableIncomeEl.textContent = formatNumber(tax.taxableIncome);
    if (taxAmountEl) taxAmountEl.textContent = formatNumber(tax.totalTax);
    if (resultDiv) resultDiv.style.display = 'block';
    
    showAlert(`Tax calculated: ৳${formatNumber(tax.totalTax)}`, 'success');
}

// VAT Calculator Functions - FIXED
function initializeVATCalculator() {
    console.log('Initializing VAT Calculator...');
    
    // Set up event listeners
    const baseAmountInput = document.getElementById('base-amount');
    const vatRateSelect = document.getElementById('vat-rate');
    
    if (baseAmountInput) {
        baseAmountInput.addEventListener('input', function() {
            setTimeout(calculateVAT, 300);
        });
    }
    
    if (vatRateSelect) {
        vatRateSelect.addEventListener('change', calculateVAT);
    }
    
    // Set up calculation type radios
    const calcTypeRadios = document.querySelectorAll('input[name="calculation-type"]');
    calcTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateVATAmountLabel();
            calculateVAT();
        });
    });
    
    updateVATAmountLabel();
    
    // Test calculation
    setTimeout(() => {
        if (baseAmountInput && !baseAmountInput.value) {
            baseAmountInput.value = '1000';
            calculateVAT();
        }
    }, 500);
}

function calculateVAT() {
    const baseAmountInput = document.getElementById('base-amount');
    const vatRateSelect = document.getElementById('vat-rate');
    const customRateInput = document.getElementById('custom-rate');
    
    if (!baseAmountInput || !vatRateSelect) return;
    
    const baseAmount = parseFloat(baseAmountInput.value);
    if (isNaN(baseAmount) || baseAmount <= 0) {
        hideVATResults();
        return;
    }
    
    // Get VAT rate
    let vatRate;
    if (vatRateSelect.value === 'custom') {
        if (!customRateInput) return;
        vatRate = parseFloat(customRateInput.value);
        if (isNaN(vatRate)) {
            showAlert('Please enter a valid custom VAT rate', 'error');
            return;
        }
    } else {
        vatRate = parseFloat(vatRateSelect.value);
    }
    
    if (isNaN(vatRate) || vatRate < 0) {
        showAlert('Please select a valid VAT rate', 'error');
        return;
    }
    
    // Get calculation type
    const calcType = document.querySelector('input[name="calculation-type"]:checked');
    if (!calcType) return;
    
    let vatAmount, totalAmount, actualBaseAmount;
    
    if (calcType.value === 'inclusive') {
        // Total amount includes VAT
        actualBaseAmount = baseAmount / (1 + (vatRate / 100));
        vatAmount = baseAmount - actualBaseAmount;
        totalAmount = baseAmount;
    } else {
        // Base amount excludes VAT
        actualBaseAmount = baseAmount;
        vatAmount = (baseAmount * vatRate) / 100;
        totalAmount = baseAmount + vatAmount;
    }
    
    // Display results
    displayVATResults(actualBaseAmount, vatRate, vatAmount, totalAmount);
    showAlert('VAT calculated successfully!', 'success');
}

function displayVATResults(baseAmount, vatRate, vatAmount, totalAmount) {
    const resultsPanel = document.getElementById('calculation-results');
    const noResults = document.getElementById('no-results');
    
    if (resultsPanel && noResults) {
        resultsPanel.style.display = 'block';
        noResults.style.display = 'none';
    }
    
    // Update result values
    const baseEl = document.getElementById('result-base');
    const rateEl = document.getElementById('result-rate');
    const vatEl = document.getElementById('result-vat');
    const totalEl = document.getElementById('result-total');
    
    if (baseEl) baseEl.textContent = formatNumber(Math.round(baseAmount));
    if (rateEl) rateEl.textContent = vatRate;
    if (vatEl) vatEl.textContent = formatNumber(Math.round(vatAmount));
    if (totalEl) totalEl.textContent = formatNumber(Math.round(totalAmount));
}

function hideVATResults() {
    const resultsPanel = document.getElementById('calculation-results');
    const noResults = document.getElementById('no-results');
    
    if (resultsPanel && noResults) {
        resultsPanel.style.display = 'none';
        noResults.style.display = 'block';
    }
}

function updateVATAmountLabel() {
    const calcType = document.querySelector('input[name="calculation-type"]:checked');
    const amountLabel = document.getElementById('amount-label');
    
    if (calcType && amountLabel) {
        if (calcType.value === 'inclusive') {
            amountLabel.textContent = 'Total Amount (৳)';
        } else {
            amountLabel.textContent = 'Base Amount (৳)';
        }
    }
}

// Tax Calculator Functions - FIXED
function initializeTaxCalculator() {
    console.log('Initializing Tax Calculator...');
    
    // Set up event listeners for all income inputs
    const incomeInputs = ['salary-income', 'business-income', 'rental-income', 'other-income'];
    incomeInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                setTimeout(calculateTax, 300);
            });
        }
    });
    
    // Set up deduction inputs
    const deductionInputs = ['investment-deduction', 'zakat-deduction', 'donation-deduction', 'other-deduction'];
    deductionInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                setTimeout(calculateTax, 300);
            });
        }
    });
    
    // Set up tax year and category
    const taxYearSelect = document.getElementById('tax-year');
    const categoryRadios = document.querySelectorAll('input[name="taxpayer-category"]');
    
    if (taxYearSelect) {
        taxYearSelect.addEventListener('change', calculateTax);
    }
    
    categoryRadios.forEach(radio => {
        radio.addEventListener('change', calculateTax);
    });
    
    // Test calculation
    setTimeout(() => {
        const salaryInput = document.getElementById('salary-income');
        if (salaryInput && !salaryInput.value) {
            salaryInput.value = '500000';
            calculateTax();
        }
    }, 500);
}

function calculateTax() {
    // Get income values
    const salary = parseFloat(document.getElementById('salary-income')?.value) || 0;
    const business = parseFloat(document.getElementById('business-income')?.value) || 0;
    const rental = parseFloat(document.getElementById('rental-income')?.value) || 0;
    const other = parseFloat(document.getElementById('other-income')?.value) || 0;
    
    const totalIncome = salary + business + rental + other;
    if (totalIncome <= 0) {
        hideTaxResults();
        return;
    }
    
    // Get deduction values
    const investment = parseFloat(document.getElementById('investment-deduction')?.value) || 0;
    const zakat = parseFloat(document.getElementById('zakat-deduction')?.value) || 0;
    const donation = parseFloat(document.getElementById('donation-deduction')?.value) || 0;
    const otherDeduction = parseFloat(document.getElementById('other-deduction')?.value) || 0;
    
    const totalDeductions = investment + zakat + donation + otherDeduction;
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    
    // Calculate tax
    const taxResult = calculateIncomeTax(taxableIncome);
    
    // Display results
    displayTaxResults(totalIncome, totalDeductions, taxableIncome, taxResult.totalTax);
    showAlert('Tax calculated successfully!', 'success');
}

function displayTaxResults(totalIncome, deductions, taxableIncome, taxLiability) {
    const resultsPanel = document.getElementById('tax-calculation-results');
    const noResults = document.getElementById('no-tax-results');
    
    if (resultsPanel && noResults) {
        resultsPanel.style.display = 'block';
        noResults.style.display = 'none';
    }
    
    // Update result values
    const totalIncomeEl = document.getElementById('tax-result-total-income');
    const deductionsEl = document.getElementById('tax-result-deductions');
    const taxableEl = document.getElementById('tax-result-taxable');
    const liabilityEl = document.getElementById('tax-result-liability');
    const monthlyEl = document.getElementById('monthly-tax');
    
    if (totalIncomeEl) totalIncomeEl.textContent = formatNumber(totalIncome);
    if (deductionsEl) deductionsEl.textContent = formatNumber(deductions);
    if (taxableEl) taxableEl.textContent = formatNumber(taxableIncome);
    if (liabilityEl) liabilityEl.textContent = formatNumber(taxLiability);
    if (monthlyEl) monthlyEl.textContent = formatNumber(Math.round(taxLiability / 12));
}

function hideTaxResults() {
    const resultsPanel = document.getElementById('tax-calculation-results');
    const noResults = document.getElementById('no-tax-results');
    
    if (resultsPanel && noResults) {
        resultsPanel.style.display = 'none';
        noResults.style.display = 'block';
    }
}

// Pricing Page Functions - FIXED
function initializePricingPage() {
    console.log('Initializing Pricing Page...');
    
    // Set up billing toggle
    const billingToggle = document.getElementById('billing-toggle');
    if (billingToggle) {
        billingToggle.addEventListener('change', function() {
            updatePricingDisplay(this.checked);
        });
    }
    
    // Set up upgrade buttons
    const upgradeButtons = document.querySelectorAll('.pro-plan-btn, [onclick*="upgradeToPro"]');
    upgradeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            upgradeToPro();
        });
    });
    
    // Initialize pricing display
    updatePricingDisplay(false);
}

function updatePricingDisplay(isYearly) {
    const monthlyPrice = document.getElementById('pro-price');
    const periodText = document.getElementById('pro-period');
    const savingsBadge = document.getElementById('yearly-savings');
    
    if (monthlyPrice && periodText) {
        if (isYearly) {
            monthlyPrice.textContent = '83';
            periodText.textContent = '/month';
            if (savingsBadge) {
                savingsBadge.style.display = 'inline-block';
            }
        } else {
            monthlyPrice.textContent = '99';
            periodText.textContent = '/month';
            if (savingsBadge) {
                savingsBadge.style.display = 'none';
            }
        }
    }
}

function upgradeToPro() {
    if (!VATAX.currentUser) {
        showAlert('Please login first to upgrade to Pro', 'warning');
        showLogin();
        return;
    }
    
    showAlert('Redirecting to payment...', 'info');
    
    // Simulate payment process
    setTimeout(() => {
        VATAX.currentUser.subscription_status = 'pro';
        VATAX.isProUser = true;
        localStorage.setItem('vatax_user', JSON.stringify(VATAX.currentUser));
        
        showAlert('🎉 Welcome to VATAX Pro! All features unlocked.', 'success');
        
        // Reload to update UI
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }, 1500);
}

// FAQ Functions - FIXED
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function() {
                const answer = item.querySelector('.faq-answer');
                const icon = question.querySelector('i');
                
                if (answer.style.display === 'block') {
                    answer.style.display = 'none';
                    if (icon) icon.className = 'fas fa-plus';
                } else {
                    answer.style.display = 'block';
                    if (icon) icon.className = 'fas fa-minus';
                }
            });
        }
    });
}

// Utility Functions
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = `custom-alert alert-${type}`;
    alert.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 300px;
        ">
            ${message}
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                margin-left: 10px;
                cursor: pointer;
                float: right;
            ">×</button>
        </div>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 4000);
}

function formatNumber(number) {
    return new Intl.NumberFormat('en-BD').format(number);
}

function showLogin() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'block';
}

function showSignup() {
    const modal = document.getElementById('signup-modal');
    if (modal) modal.style.display = 'block';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function logout() {
    localStorage.removeItem('vatax_user');
    localStorage.removeItem('vatax_session');
    VATAX.currentUser = null;
    VATAX.isProUser = false;
    
    showAlert('Logged out successfully', 'info');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Basic income tax calculation
function calculateIncomeTax(income, category = 'individual') {
    const slabs = [
        { min: 0, max: 350000, rate: 0 },
        { min: 350000, max: 450000, rate: 5 },
        { min: 450000, max: 750000, rate: 10 },
        { min: 750000, max: 1150000, rate: 15 },
        { min: 1150000, max: 1650000, rate: 20 },
        { min: 1650000, max: Infinity, rate: 25 }
    ];
    
    let tax = 0;
    let remaining = income;
    
    for (const slab of slabs) {
        if (remaining <= 0) break;
        
        const taxable = Math.min(remaining, slab.max - slab.min);
        tax += (taxable * slab.rate) / 100;
        remaining -= taxable;
    }
    
    return {
        taxableIncome: income,
        totalTax: Math.round(tax),
        effectiveRate: income > 0 ? (tax / income) * 100 : 0
    };
}

// Navigation functions
function updateNavigationState() {
    const authSection = document.getElementById('auth-buttons');
    const userSection = document.getElementById('user-menu');
    
    if (VATAX.currentUser) {
        if (authSection) authSection.style.display = 'none';
        if (userSection) {
            userSection.style.display = 'block';
            const userName = document.getElementById('user-name');
            if (userName) userName.textContent = VATAX.currentUser.name;
        }
    } else {
        if (authSection) authSection.style.display = 'block';
        if (userSection) userSection.style.display = 'none';
    }
}

function updateUIForLoggedInUser() {
    // Enable pro features if user is pro
    if (VATAX.isProUser) {
        document.querySelectorAll('.pro-feature').forEach(el => {
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
        });
    }
}

function checkUserSession() {
    try {
        const userData = localStorage.getItem('vatax_user');
        if (userData) {
            VATAX.currentUser = JSON.parse(userData);
            VATAX.isProUser = VATAX.currentUser.subscription_status === 'pro';
            updateNavigationState();
            updateUIForLoggedInUser();
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeFAQ();
});

// Global exports
window.calculateQuickVAT = calculateQuickVAT;
window.calculateQuickTax = calculateQuickTax;
window.calculateVAT = calculateVAT;
window.calculateTax = calculateTax;
window.showLogin = showLogin;
window.showSignup = showSignup;
window.closeModal = closeModal;
window.logout = logout;
window.upgradeToPro = upgradeToPro;
window.VATAX = window.VATAX || VATAX;

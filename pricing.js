// Pricing Page JavaScript
// Handles subscription upgrades, billing toggles, and payment processing

// Pricing State
const Pricing = {
    selectedPlan: null,
    selectedBilling: 'monthly',
    selectedPayment: null,
    isProcessing: false
};

// Pricing Configuration
const PRICING_CONFIG = {
    plans: {
        pro_monthly: {
            price: 99,
            billing: 'monthly',
            savings: 0,
            features: ['All Free Features', 'Unlimited Calculations', 'Save History', 'PDF Export', 'Email Reports', 'Tax Tips']
        },
        pro_yearly: {
            price: 999,
            billing: 'yearly',
            monthlyEquivalent: 83,
            savings: 200,
            features: ['All Pro Monthly Features', 'Annual Billing Discount', 'Save 17%']
        }
    },
    paymentMethods: {
        bkash: {
            name: 'bKash',
            icon: 'fas fa-mobile-alt',
            color: 'orange',
            processing: 'Redirecting to bKash...'
        },
        nagad: {
            name: 'Nagad',
            icon: 'fas fa-university',
            color: 'green',
            processing: 'Redirecting to Nagad...'
        },
        card: {
            name: 'Credit/Debit Card',
            icon: 'fas fa-credit-card',
            color: 'navy',
            processing: 'Processing card payment...'
        }
    }
};

// DOM Content Loaded Event for Pricing Page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('pricing.html')) {
        initializePricingPage();
    }
});

function initializePricingPage() {
    setupPricingEventListeners();
    updatePricingDisplay();
    handleURLParameters();
}

function setupPricingEventListeners() {
    // Billing toggle
    const billingToggle = document.getElementById('billing-toggle');
    if (billingToggle) {
        billingToggle.addEventListener('change', toggleBilling);
    }
    
    // Plan selection buttons
    setupPlanButtons();
    
    // Payment method selection in upgrade modal
    setupPaymentMethodButtons();
    
    // Upgrade modal form
    const upgradeModal = document.getElementById('upgrade-modal');
    if (upgradeModal) {
        setupUpgradeModal();
    }
}

function setupPlanButtons() {
    // Free plan signup
    const freeButtons = document.querySelectorAll('[onclick*="signupFree"]');
    freeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            signupFree();
        });
    });
    
    // Pro plan upgrade
    const proButtons = document.querySelectorAll('[onclick*="upgradeToPro"]');
    proButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            upgradeToPro();
        });
    });
    
    // Enterprise contact
    const enterpriseButtons = document.querySelectorAll('[onclick*="contactSales"]');
    enterpriseButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            contactSales();
        });
    });
}

function setupPaymentMethodButtons() {
    const paymentButtons = document.querySelectorAll('[onclick*="selectPayment"]');
    paymentButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const method = this.getAttribute('onclick').match(/selectPayment\('([^']+)'\)/)[1];
            selectPayment(method);
        });
    });
}

function setupUpgradeModal() {
    // Plan selection radio buttons
    const planRadios = document.querySelectorAll('input[name="upgrade-plan"]');
    planRadios.forEach(radio => {
        radio.addEventListener('change', updateUpgradeModalPricing);
    });
}

function toggleBilling() {
    const billingToggle = document.getElementById('billing-toggle');
    const isYearly = billingToggle.checked;
    
    Pricing.selectedBilling = isYearly ? 'yearly' : 'monthly';
    updatePricingDisplay();
}

function updatePricingDisplay() {
    const isYearly = Pricing.selectedBilling === 'yearly';
    
    // Update Pro plan pricing
    const proPriceElement = document.getElementById('pro-price');
    const proPeriodElement = document.getElementById('pro-period');
    const yearlySavingsElement = document.getElementById('yearly-savings');
    
    if (proPriceElement && proPeriodElement) {
        if (isYearly) {
            proPriceElement.textContent = '৳83';
            proPeriodElement.textContent = '/month';
            if (yearlySavingsElement) {
                yearlySavingsElement.classList.remove('hidden');
            }
        } else {
            proPriceElement.textContent = '৳99';
            proPeriodElement.textContent = '/month';
            if (yearlySavingsElement) {
                yearlySavingsElement.classList.add('hidden');
            }
        }
    }
    
    // Update featured plan styling based on billing
    const proCard = document.querySelector('.pricing-card.featured');
    if (proCard && isYearly) {
        proCard.style.borderColor = 'var(--green)';
    } else if (proCard) {
        proCard.style.borderColor = 'var(--orange)';
    }
}

function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Auto-open upgrade modal if coming from calculator
    if (urlParams.get('upgrade') === 'true') {
        setTimeout(() => {
            upgradeToPro();
        }, 500);
    }
    
    // Set billing preference from URL
    const billing = urlParams.get('billing');
    if (billing === 'yearly') {
        const billingToggle = document.getElementById('billing-toggle');
        if (billingToggle) {
            billingToggle.checked = true;
            toggleBilling();
        }
    }
}

// Plan Selection Functions
function signupFree() {
    if (VATAX.currentUser) {
        showAlert('You are already logged in. Free features are available now!', 'info');
        return;
    }
    
    // Show signup modal with free plan context
    showSignup();
    
    // Add free plan context to signup form
    const signupModal = document.getElementById('signup-modal');
    if (signupModal) {
        const formTitle = signupModal.querySelector('h2');
        if (formTitle) {
            formTitle.textContent = 'Start Using VATAX Free';
        }
        
        // Add plan information
        const planInfo = document.createElement('div');
        planInfo.className = 'mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm';
        planInfo.innerHTML = `
            <div class="font-semibold text-green">Free Plan Selected</div>
            <div class="text-gray-600">Get access to basic VAT and tax calculators instantly</div>
        `;
        
        const form = signupModal.querySelector('form');
        form.insertBefore(planInfo, form.firstChild);
    }
}

function upgradeToPro() {
    if (!VATAX.currentUser) {
        showAlert('Please login or create an account first', 'warning');
        setTimeout(() => {
            showLogin();
        }, 1000);
        return;
    }
    
    if (VATAX.isProUser) {
        showAlert('You are already a Pro user!', 'info');
        return;
    }
    
    showModal('upgrade-modal');
    updateUpgradeModalPricing();
}

function contactSales() {
    // Create contact form modal
    const contactModal = createContactSalesModal();
    document.body.appendChild(contactModal);
    showModal(contactModal.id);
}

function createContactSalesModal() {
    const modal = document.createElement('div');
    modal.id = 'contact-sales-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="text-2xl font-bold text-navy">Contact Sales</h2>
                <button onclick="closeModal('contact-sales-modal')" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="contact-sales-form" class="space-y-4">
                <div>
                    <label class="form-label">Company Name</label>
                    <input type="text" id="company-name" class="form-input" required>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Your Name</label>
                        <input type="text" id="contact-name" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Job Title</label>
                        <input type="text" id="job-title" class="form-input">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Email</label>
                        <input type="email" id="contact-email" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">Phone</label>
                        <input type="tel" id="contact-phone" class="form-input">
                    </div>
                </div>
                <div>
                    <label class="form-label">Number of Users</label>
                    <select id="user-count" class="form-input">
                        <option value="10-50">10-50 users</option>
                        <option value="50-100">50-100 users</option>
                        <option value="100-500">100-500 users</option>
                        <option value="500+">500+ users</option>
                    </select>
                </div>
                <div>
                    <label class="form-label">Requirements</label>
                    <textarea id="requirements" class="form-input" rows="4" placeholder="Tell us about your specific requirements..."></textarea>
                </div>
                <button type="submit" class="w-full btn-primary">Send Request</button>
            </form>
        </div>
    `;
    
    const form = modal.querySelector('#contact-sales-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitContactSalesForm();
        closeModal('contact-sales-modal');
        modal.remove();
    });
    
    return modal;
}

function updateUpgradeModalPricing() {
    const selectedPlan = document.querySelector('input[name="upgrade-plan"]:checked');
    if (!selectedPlan) return;
    
    Pricing.selectedPlan = selectedPlan.value;
    
    // Update pricing display in modal based on selection
    const planLabels = document.querySelectorAll('label[for*="upgrade-plan"]');
    planLabels.forEach(label => {
        const radio = label.querySelector('input');
        if (radio && radio.checked) {
            label.classList.add('border-green');
            label.classList.remove('border-gray-200');
        } else {
            label.classList.remove('border-green');
            label.classList.add('border-gray-200');
        }
    });
}

// Payment Processing Functions
function selectPayment(method) {
    Pricing.selectedPayment = method;
    
    // Update payment button styling
    const paymentButtons = document.querySelectorAll('[onclick*="selectPayment"]');
    paymentButtons.forEach(button => {
        button.classList.remove('border-orange', 'border-green', 'border-navy');
        button.classList.add('border-gray-200');
    });
    
    // Highlight selected payment method
    const selectedButton = document.querySelector(`[onclick*="selectPayment('${method}')"]`);
    if (selectedButton) {
        const config = PRICING_CONFIG.paymentMethods[method];
        selectedButton.classList.add(`border-${config.color}`);
        selectedButton.classList.remove('border-gray-200');
    }
}

async function processUpgrade() {
    if (Pricing.isProcessing) return;
    
    // Validate selections
    if (!Pricing.selectedPlan) {
        showAlert('Please select a plan', 'warning');
        return;
    }
    
    if (!Pricing.selectedPayment) {
        showAlert('Please select a payment method', 'warning');
        return;
    }
    
    Pricing.isProcessing = true;
    
    const upgradeButton = document.querySelector('[onclick="processUpgrade()"]');
    if (upgradeButton) {
        const originalText = upgradeButton.innerHTML;
        const paymentConfig = PRICING_CONFIG.paymentMethods[Pricing.selectedPayment];
        upgradeButton.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${paymentConfig.processing}`;
        upgradeButton.disabled = true;
    }
    
    try {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Process the upgrade
        const result = await processSubscriptionUpgrade();
        
        if (result.success) {
            // Update user subscription status
            VATAX.currentUser.subscription_status = 'pro';
            VATAX.currentUser.subscription_plan = Pricing.selectedPlan;
            VATAX.currentUser.subscription_expires = result.expiresAt;
            VATAX.isProUser = true;
            
            // Update local storage
            localStorage.setItem('vatax_user', JSON.stringify(VATAX.currentUser));
            
            // Update UI
            updateUIForLoggedInUser();
            
            closeModal('upgrade-modal');
            showUpgradeSuccessModal();
        } else {
            throw new Error(result.message || 'Payment failed');
        }
    } catch (error) {
        console.error('Upgrade error:', error);
        showAlert('Payment failed. Please try again.', 'error');
    } finally {
        Pricing.isProcessing = false;
        
        if (upgradeButton) {
            upgradeButton.innerHTML = 'Start 7-Day Free Trial';
            upgradeButton.disabled = false;
        }
    }
}

async function processSubscriptionUpgrade() {
    // Simulate payment processing with different payment methods
    const paymentMethod = Pricing.selectedPayment;
    const plan = Pricing.selectedPlan;
    
    // Simulate different success rates for different payment methods
    const successRates = {
        bkash: 0.95,
        nagad: 0.93,
        card: 0.98
    };
    
    const success = Math.random() < successRates[paymentMethod];
    
    if (success) {
        const expiresAt = new Date();
        if (plan === 'yearly') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        }
        
        return {
            success: true,
            transactionId: 'TXN_' + Date.now(),
            expiresAt: expiresAt.toISOString(),
            amount: plan === 'yearly' ? 999 : 99
        };
    } else {
        return {
            success: false,
            message: 'Payment declined by payment gateway'
        };
    }
}

function showUpgradeSuccessModal() {
    const successModal = document.createElement('div');
    successModal.id = 'upgrade-success-modal';
    successModal.className = 'modal';
    successModal.innerHTML = `
        <div class="modal-content text-center">
            <div class="mb-6">
                <div class="w-20 h-20 bg-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check text-white text-3xl"></i>
                </div>
                <h2 class="text-3xl font-bold text-navy mb-2">Welcome to VATAX Pro!</h2>
                <p class="text-gray-600">Your subscription has been activated successfully</p>
            </div>
            
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 class="font-semibold text-navy mb-2">What's now available:</h3>
                <ul class="text-sm text-gray-700 space-y-1">
                    <li><i class="fas fa-check text-green mr-2"></i>Unlimited calculations</li>
                    <li><i class="fas fa-check text-green mr-2"></i>Save calculation history</li>
                    <li><i class="fas fa-check text-green mr-2"></i>PDF export & reports</li>
                    <li><i class="fas fa-check text-green mr-2"></i>Email/SMS reports</li>
                    <li><i class="fas fa-check text-green mr-2"></i>Tax saving tips</li>
                    <li><i class="fas fa-check text-green mr-2"></i>Priority support</li>
                </ul>
            </div>
            
            <div class="space-y-3">
                <button onclick="goToDashboard()" class="w-full btn-green">
                    Go to Dashboard
                </button>
                <button onclick="closeModal('upgrade-success-modal'); document.getElementById('upgrade-success-modal').remove();" class="w-full btn-outline-orange">
                    Continue Exploring
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(successModal);
    showModal('upgrade-success-modal');
    
    // Auto-remove modal after 5 minutes
    setTimeout(() => {
        const modal = document.getElementById('upgrade-success-modal');
        if (modal) modal.remove();
    }, 300000);
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}

function submitContactSalesForm() {
    const formData = {
        companyName: document.getElementById('company-name').value,
        contactName: document.getElementById('contact-name').value,
        jobTitle: document.getElementById('job-title').value,
        email: document.getElementById('contact-email').value,
        phone: document.getElementById('contact-phone').value,
        userCount: document.getElementById('user-count').value,
        requirements: document.getElementById('requirements').value,
        timestamp: new Date().toISOString()
    };
    
    // Save contact request (in real app, send to server)
    const contactRequests = JSON.parse(localStorage.getItem('vatax_contact_requests') || '[]');
    contactRequests.push(formData);
    localStorage.setItem('vatax_contact_requests', JSON.stringify(contactRequests));
    
    showAlert('Contact request submitted! Our sales team will reach out within 24 hours.', 'success');
}

// Pricing Analytics (for business intelligence)
function trackPricingPageView() {
    const analytics = {
        page: 'pricing',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        user: VATAX.currentUser?.id || 'anonymous'
    };
    
    // Send to analytics service
    console.log('Pricing page view:', analytics);
}

function trackPlanInteraction(action, plan) {
    const analytics = {
        action: action, // 'view', 'select', 'upgrade'
        plan: plan,
        timestamp: new Date().toISOString(),
        user: VATAX.currentUser?.id || 'anonymous'
    };
    
    console.log('Plan interaction:', analytics);
}

// Initialize pricing page analytics
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('pricing.html')) {
        trackPricingPageView();
    }
});

// Export functions to global scope
window.toggleBilling = toggleBilling;
window.signupFree = signupFree;
window.upgradeToPro = upgradeToPro;
window.contactSales = contactSales;
window.selectPayment = selectPayment;
window.processUpgrade = processUpgrade;
window.goToDashboard = goToDashboard;
// Pricing Page JavaScript - Netlify compatible
const Pricing = {
    selectedPlan: null,
    selectedBilling: 'monthly',
    selectedPayment: null,
    isProcessing: false
};

// DOM Content Loaded Event for Pricing Page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('pricing.html') || 
        document.getElementById('pricing-section')) {
        initializePricingPage();
    }
});

function initializePricingPage() {
    setupPricingEventListeners();
    updatePricingDisplay();
    handleURLParameters();
    trackPricingPageView();
}

function setupPricingEventListeners() {
    // Billing toggle
    const billingToggle = document.getElementById('billing-toggle');
    if (billingToggle) {
        billingToggle.addEventListener('change', toggleBilling);
    }
    
    // Plan selection buttons
    setupPlanButtons();
    
    // Payment method selection
    setupPaymentMethodButtons();
    
    // Upgrade modal form
    setupUpgradeModal();
}

function setupPlanButtons() {
    // Free plan signup
    const freeButtons = document.querySelectorAll('.free-plan-btn');
    freeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            signupFree();
        });
    });
    
    // Pro plan upgrade
    const proButtons = document.querySelectorAll('.pro-plan-btn');
    proButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            upgradeToPro();
        });
    });
    
    // Enterprise contact
    const enterpriseButtons = document.querySelectorAll('.enterprise-plan-btn');
    enterpriseButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            contactSales();
        });
    });
}

function setupPaymentMethodButtons() {
    const paymentButtons = document.querySelectorAll('.payment-method-btn');
    paymentButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const method = this.getAttribute('data-method');
            selectPayment(method);
        });
    });
}

function setupUpgradeModal() {
    const upgradeModal = document.getElementById('upgrade-modal');
    if (upgradeModal) {
        // Plan selection radio buttons
        const planRadios = document.querySelectorAll('input[name="upgrade-plan"]');
        planRadios.forEach(radio => {
            radio.addEventListener('change', updateUpgradeModalPricing);
        });
        
        // Payment method buttons
        const paymentButtons = upgradeModal.querySelectorAll('.payment-method-btn');
        paymentButtons.forEach(button => {
            button.addEventListener('click', function() {
                const method = this.getAttribute('data-method');
                selectPayment(method);
            });
        });
        
        // Upgrade form submission
        const upgradeForm = document.getElementById('upgrade-form');
        if (upgradeForm) {
            upgradeForm.addEventListener('submit', function(e) {
                e.preventDefault();
                processUpgrade();
            });
        }
    }
}

function toggleBilling() {
    const billingToggle = document.getElementById('billing-toggle');
    if (!billingToggle) return;
    
    const isYearly = billingToggle.checked;
    Pricing.selectedBilling = isYearly ? 'yearly' : 'monthly';
    updatePricingDisplay();
    trackPlanInteraction('billing_toggle', Pricing.selectedBilling);
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
                yearlySavingsElement.style.display = 'block';
            }
        } else {
            proPriceElement.textContent = '৳99';
            proPeriodElement.textContent = '/month';
            if (yearlySavingsElement) {
                yearlySavingsElement.style.display = 'none';
            }
        }
    }
    
    // Update featured plan styling
    const proCard = document.querySelector('.pricing-card.featured');
    if (proCard) {
        if (isYearly) {
            proCard.style.borderColor = '#10B981';
        } else {
            proCard.style.borderColor = '#FF9933';
        }
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
    
    showSignup();
    trackPlanInteraction('free_plan_click', 'free');
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
    trackPlanInteraction('pro_plan_click', 'pro');
}

function contactSales() {
    const contactModal = createContactSalesModal();
    document.body.appendChild(contactModal);
    showModal(contactModal.id);
    trackPlanInteraction('enterprise_contact', 'enterprise');
}

function createContactSalesModal() {
    const modal = document.createElement('div');
    modal.id = 'contact-sales-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 style="font-size: 1.5rem; font-weight: bold; color: #1e3a8a;">Contact Sales</h2>
                <button onclick="closeModal('contact-sales-modal')" style="color: #6b7280; background: none; border: none; font-size: 1.25rem; cursor: pointer;">×</button>
            </div>
            <form id="contact-sales-form" style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Company Name</label>
                    <input type="text" id="company-name" class="form-input" required>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Your Name</label>
                        <input type="text" id="contact-name" class="form-input" required>
                    </div>
                    <div>
                        <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Job Title</label>
                        <input type="text" id="job-title" class="form-input">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Email</label>
                        <input type="email" id="contact-email" class="form-input" required>
                    </div>
                    <div>
                        <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Phone</label>
                        <input type="tel" id="contact-phone" class="form-input">
                    </div>
                </div>
                <div>
                    <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Number of Users</label>
                    <select id="user-count" class="form-input">
                        <option value="10-50">10-50 users</option>
                        <option value="50-100">50-100 users</option>
                        <option value="100-500">100-500 users</option>
                        <option value="500+">500+ users</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Requirements</label>
                    <textarea id="requirements" class="form-input" rows="4" placeholder="Tell us about your specific requirements..."></textarea>
                </div>
                <button type="submit" class="btn-primary">Send Request</button>
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
            label.style.borderColor = '#10B981';
        } else {
            label.style.borderColor = '#e5e7eb';
        }
    });
}

// Payment Processing Functions
function selectPayment(method) {
    Pricing.selectedPayment = method;
    
    // Update payment button styling
    const paymentButtons = document.querySelectorAll('.payment-method-btn');
    paymentButtons.forEach(button => {
        button.style.borderColor = '#e5e7eb';
    });
    
    // Highlight selected payment method
    const selectedButton = document.querySelector(`[data-method="${method}"]`);
    if (selectedButton) {
        selectedButton.style.borderColor = '#FF9933';
    }
    
    trackPlanInteraction('payment_method_selected', method);
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
    
    const upgradeButton = document.querySelector('#upgrade-form button[type="submit"]');
    if (upgradeButton) {
        const originalText = upgradeButton.innerHTML;
        upgradeButton.innerHTML = 'Processing...';
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
            if (typeof updateUIForLoggedInUser === 'function') {
                updateUIForLoggedInUser();
            }
            
            closeModal('upgrade-modal');
            showUpgradeSuccessModal();
            
            trackPlanInteraction('upgrade_success', Pricing.selectedPlan);
        } else {
            throw new Error(result.message || 'Payment failed');
        }
    } catch (error) {
        console.error('Upgrade error:', error);
        showAlert('Payment failed. Please try again.', 'error');
        trackPlanInteraction('upgrade_failed', Pricing.selectedPlan);
    } finally {
        Pricing.isProcessing = false;
        
        if (upgradeButton) {
            upgradeButton.innerHTML = 'Start 7-Day Free Trial';
            upgradeButton.disabled = false;
        }
    }
}

async function processSubscriptionUpgrade() {
    // Simulate payment processing
    const success = Math.random() < 0.95; // 95% success rate
    
    if (success) {
        const expiresAt = new Date();
        if (Pricing.selectedPlan === 'yearly') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        }
        
        return {
            success: true,
            transactionId: 'TXN_' + Date.now(),
            expiresAt: expiresAt.toISOString(),
            amount: Pricing.selectedPlan === 'yearly' ? 999 : 99
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
        <div class="modal-content" style="text-align: center;">
            <div style="margin-bottom: 1.5rem;">
                <div style="width: 80px; height: 80px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                    <span style="color: white; font-size: 2rem;">✓</span>
                </div>
                <h2 style="font-size: 1.875rem; font-weight: bold; color: #1e3a8a; margin-bottom: 0.5rem;">Welcome to VATAX Pro!</h2>
                <p style="color: #6b7280;">Your subscription has been activated successfully</p>
            </div>
            
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h3 style="font-weight: 600; color: #1e3a8a; margin-bottom: 0.5rem;">What's now available:</h3>
                <ul style="text-align: left; color: #374151; font-size: 14px;">
                    <li style="margin-bottom: 0.25rem;">✓ Unlimited calculations</li>
                    <li style="margin-bottom: 0.25rem;">✓ Save calculation history</li>
                    <li style="margin-bottom: 0.25rem;">✓ PDF export & reports</li>
                    <li style="margin-bottom: 0.25rem;">✓ Email/SMS reports</li>
                    <li style="margin-bottom: 0.25rem;">✓ Tax saving tips</li>
                    <li>✓ Priority support</li>
                </ul>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <button onclick="goToDashboard()" class="btn-green">Go to Dashboard</button>
                <button onclick="closeSuccessModal()" class="btn-outline-orange">Continue Exploring</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(successModal);
    showModal('upgrade-success-modal');
}

function closeSuccessModal() {
    closeModal('upgrade-success-modal');
    const modal = document.getElementById('upgrade-success-modal');
    if (modal) modal.remove();
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}

function submitContactSalesForm() {
    const formData = {
        companyName: document.getElementById('company-name')?.value,
        contactName: document.getElementById('contact-name')?.value,
        jobTitle: document.getElementById('job-title')?.value,
        email: document.getElementById('contact-email')?.value,
        phone: document.getElementById('contact-phone')?.value,
        userCount: document.getElementById('user-count')?.value,
        requirements: document.getElementById('requirements')?.value,
        timestamp: new Date().toISOString()
    };
    
    // Save contact request
    try {
        const contactRequests = JSON.parse(localStorage.getItem('vatax_contact_requests') || '[]');
        contactRequests.push(formData);
        localStorage.setItem('vatax_contact_requests', JSON.stringify(contactRequests));
        
        showAlert('Contact request submitted! Our sales team will reach out within 24 hours.', 'success');
    } catch (error) {
        console.error('Error saving contact request:', error);
        showAlert('Error submitting request. Please try again.', 'error');
    }
}

// Pricing Analytics
function trackPricingPageView() {
    console.log('Pricing page viewed by:', VATAX.currentUser?.id || 'anonymous');
}

function trackPlanInteraction(action, plan) {
    console.log('Plan interaction:', { action, plan, user: VATAX.currentUser?.id || 'anonymous' });
}

// Netlify-specific pricing page fixes
function setupPricingPageSPA() {
    // Handle SPA navigation for pricing page
    if (window.location.hash === '#pricing') {
        initializePricingPage();
    }
}

// Export functions to global scope
window.toggleBilling = toggleBilling;
window.signupFree = signupFree;
window.upgradeToPro = upgradeToPro;
window.contactSales = contactSales;
window.selectPayment = selectPayment;
window.processUpgrade = processUpgrade;
window.goToDashboard = goToDashboard;
window.closeSuccessModal = closeSuccessModal;
window.Pricing = Pricing;

// Initialize pricing page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePricingPage);
} else {
    initializePricingPage();
}

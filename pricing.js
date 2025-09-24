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

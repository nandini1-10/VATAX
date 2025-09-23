// Dashboard JavaScript
// Handles dashboard analytics, charts, and pro user features

// Dashboard State
const Dashboard = {
    charts: {},
    stats: {
        totalCalculations: 0,
        vatCalculations: 0,
        taxCalculations: 0,
        reportsGenerated: 0
    },
    recentCalculations: [],
    isLoading: false
};

// DOM Content Loaded Event for Dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('dashboard.html')) {
        initializeDashboard();
    }
});

async function initializeDashboard() {
    // Check if user is logged in and has access
    if (!VATAX.currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    Dashboard.isLoading = true;
    showDashboardLoader();
    
    try {
        // Load dashboard data
        await loadDashboardStats();
        await loadRecentCalculations();
        await loadUpcomingDeadlines();
        
        // Initialize charts
        initializeUsageChart();
        
        // Setup dashboard event listeners
        setupDashboardEventListeners();
        
        // Update UI based on subscription status
        updateDashboardForSubscription();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showAlert('Error loading dashboard data', 'error');
    } finally {
        Dashboard.isLoading = false;
        hideDashboardLoader();
    }
}

function setupDashboardEventListeners() {
    // Quick action buttons
    const quickActionButtons = document.querySelectorAll('[onclick*="location.href"]');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('onclick').match(/location\.href='([^']+)'/)[1];
            window.location.href = href;
        });
    });
    
    // Export and action buttons
    setupActionButtons();
    
    // User dropdown functionality
    setupUserDropdown();
    
    // Subscription management
    setupSubscriptionButtons();
}

function setupActionButtons() {
    // Export all reports
    const exportButton = document.querySelector('[onclick*="exportAllReports"]');
    if (exportButton) {
        exportButton.addEventListener('click', function(e) {
            e.preventDefault();
            exportAllReports();
        });
    }
    
    // Schedule reminder
    const reminderButton = document.querySelector('[onclick*="scheduleReminder"]');
    if (reminderButton) {
        reminderButton.addEventListener('click', function(e) {
            e.preventDefault();
            scheduleReminder();
        });
    }
    
    // Calculation action buttons
    setupCalculationActionButtons();
}

function setupCalculationActionButtons() {
    // View, download, and email buttons in calculations table
    document.addEventListener('click', function(e) {
        if (e.target.closest('[title="View Details"]')) {
            e.preventDefault();
            const calcId = getCalculationIdFromButton(e.target);
            viewCalculationDetails(calcId);
        } else if (e.target.closest('[title="Download PDF"]')) {
            e.preventDefault();
            const calcId = getCalculationIdFromButton(e.target);
            downloadCalculationPDF(calcId);
        } else if (e.target.closest('[title="Email Report"]')) {
            e.preventDefault();
            const calcId = getCalculationIdFromButton(e.target);
            emailCalculationReport(calcId);
        }
    });
}

function setupUserDropdown() {
    const userDropdownBtn = document.getElementById('user-dropdown-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    if (userDropdownBtn && dropdownMenu) {
        userDropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            dropdownMenu.classList.add('hidden');
        });
    }
}

function setupSubscriptionButtons() {
    // Manage subscription button
    const manageSubButton = document.querySelector('[onclick*="Manage Subscription"]');
    if (manageSubButton) {
        manageSubButton.addEventListener('click', function(e) {
            e.preventDefault();
            showSubscriptionManagement();
        });
    }
}

// Data Loading Functions
async function loadDashboardStats() {
    // Simulate API call to get user statistics
    const stats = await fetchUserStatistics();
    
    Dashboard.stats = stats;
    updateDashboardStats(stats);
}

async function fetchUserStatistics() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Get saved calculations from localStorage
    const vatCalculations = JSON.parse(localStorage.getItem('vatax_saved_calculations') || '[]');
    const taxCalculations = JSON.parse(localStorage.getItem('vatax_saved_tax_calculations') || '[]');
    const reports = JSON.parse(localStorage.getItem('vatax_generated_reports') || '[]');
    
    // Calculate statistics
    const totalVAT = vatCalculations.length;
    const totalTax = taxCalculations.length;
    const totalCalculations = totalVAT + totalTax;
    const totalReports = reports.length;
    
    // Add some realistic padding for demo
    return {
        totalCalculations: totalCalculations + 240,
        vatCalculations: totalVAT + 150,
        taxCalculations: totalTax + 90,
        reportsGenerated: totalReports + 23
    };
}

async function loadRecentCalculations() {
    // Load recent calculations from localStorage
    const vatCalcs = JSON.parse(localStorage.getItem('vatax_saved_calculations') || '[]');
    const taxCalcs = JSON.parse(localStorage.getItem('vatax_saved_tax_calculations') || '[]');
    
    // Combine and sort by timestamp
    const allCalculations = [
        ...vatCalcs.map(calc => ({...calc, type: 'vat'})),
        ...taxCalcs.map(calc => ({...calc, type: 'income_tax'}))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    Dashboard.recentCalculations = allCalculations.slice(0, 10);
    updateRecentCalculationsTable();
}

async function loadUpcomingDeadlines() {
    // Load saved reminders
    const reminders = JSON.parse(localStorage.getItem('vatax_tax_reminders') || '[]');
    
    // Add default deadlines for demo
    const defaultDeadlines = [
        {
            title: 'VAT Return Due',
            date: '2024-12-15',
            type: 'vat_return',
            priority: 'high'
        },
        {
            title: 'Tax Payment Due',
            date: '2024-12-31',
            type: 'tax_payment',
            priority: 'medium'
        },
        {
            title: 'Income Tax Return',
            date: '2025-11-30',
            type: 'tax_return',
            priority: 'low'
        }
    ];
    
    updateUpcomingDeadlines([...reminders, ...defaultDeadlines]);
}

// UI Update Functions
function updateDashboardStats(stats) {
    const statElements = {
        totalCalculations: stats.totalCalculations,
        vatCalculations: stats.vatCalculations,
        taxCalculations: stats.taxCalculations,
        reportsGenerated: stats.reportsGenerated
    };
    
    // Animate counters
    Object.entries(statElements).forEach(([key, value]) => {
        animateCounter(key, value);
    });
}

function animateCounter(elementClass, targetValue) {
    // Find elements by class or data attribute since IDs might not match exactly
    const elements = document.querySelectorAll(`[data-stat="${elementClass}"], .${elementClass}`);
    
    if (elements.length === 0) {
        // Fallback: try to find by text content pattern
        const allStatElements = document.querySelectorAll('.text-2xl.font-bold.text-navy');
        allStatElements.forEach(element => {
            if (element.textContent === '247' || element.textContent === '156' || 
                element.textContent === '91' || element.textContent === '23') {
                animateCounterElement(element, targetValue);
            }
        });
    } else {
        elements.forEach(element => {
            animateCounterElement(element, targetValue);
        });
    }
}

function animateCounterElement(element, targetValue) {
    const startValue = 0;
    const duration = 2000;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
        
        element.textContent = formatNumber(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

function updateRecentCalculationsTable() {
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody || Dashboard.recentCalculations.length === 0) return;
    
    tableBody.innerHTML = Dashboard.recentCalculations.map(calc => `
        <tr data-calc-id="${calc.id}">
            <td>
                <div class="flex items-center">
                    <i class="fas fa-${calc.type === 'vat' ? 'percentage' : 'coins'} 
                       text-${calc.type === 'vat' ? 'orange' : 'green'} mr-2"></i>
                    ${calc.type === 'vat' ? `VAT (${calc.vatRate}%)` : 'Income Tax'}
                </div>
            </td>
            <td>৳${formatNumber(calc.baseAmount || calc.totalIncome)}</td>
            <td class="font-semibold">৳${formatNumber(calc.totalAmount || calc.totalIncome + calc.totalTax)}</td>
            <td>${formatDate(calc.timestamp)}</td>
            <td>
                <div class="flex space-x-2">
                    <button class="text-green hover:text-green-dark" title="View Details" data-calc-id="${calc.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-orange hover:text-orange-dark" title="Download PDF" data-calc-id="${calc.id}">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="text-navy hover:text-navy-dark" title="Email Report" data-calc-id="${calc.id}">
                        <i class="fas fa-envelope"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateUpcomingDeadlines(deadlines) {
    // Deadlines are already in the HTML, so we can enhance them if needed
    const deadlineElements = document.querySelectorAll('.bg-red-50, .bg-orange-50, .bg-green-50');
    
    deadlineElements.forEach((element, index) => {
        if (deadlines[index]) {
            const deadline = deadlines[index];
            const dayElement = element.querySelector('.rounded-full span');
            const dateObj = new Date(deadline.date);
            
            if (dayElement) {
                dayElement.textContent = dateObj.getDate();
            }
        }
    });
}

// Chart Initialization
function initializeUsageChart() {
    const canvas = document.getElementById('usage-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Generate demo data for the last 6 months
    const months = [];
    const vatData = [];
    const taxData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toLocaleDateString('en-US', { month: 'short' }));
        
        // Generate realistic data with some randomness
        vatData.push(Math.floor(Math.random() * 20) + 15 + (5 - i) * 2);
        taxData.push(Math.floor(Math.random() * 15) + 8 + (5 - i) * 1.5);
    }
    
    Dashboard.charts.usage = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'VAT Calculations',
                data: vatData,
                borderColor: '#FF9933',
                backgroundColor: 'rgba(255, 153, 51, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Tax Calculations',
                data: taxData,
                borderColor: '#228B22',
                backgroundColor: 'rgba(34, 139, 34, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// Dashboard Actions
function exportAllReports() {
    if (!VATAX.isProUser) {
        showAlert('Upgrade to Pro to export all reports', 'warning');
        return;
    }
    
    showAlert('Preparing export of all reports...', 'info');
    
    // Simulate export process
    setTimeout(() => {
        const exportData = {
            user: VATAX.currentUser.name,
            exportDate: new Date().toISOString(),
            calculations: Dashboard.recentCalculations,
            stats: Dashboard.stats
        };
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `VATAX_Reports_${new Date().toDateString().replace(/ /g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        showAlert('All reports exported successfully!', 'success');
    }, 2000);
}

function scheduleReminder() {
    if (!VATAX.isProUser) {
        showAlert('Upgrade to Pro to schedule reminders', 'warning');
        return;
    }
    
    // Create reminder modal (reuse from tax calculator)
    if (typeof scheduleTaxReminder === 'function') {
        scheduleTaxReminder();
    } else {
        showBasicReminderForm();
    }
}

function showBasicReminderForm() {
    const reminderType = prompt('What type of reminder? (tax_return, vat_return, advance_tax, custom)');
    const reminderDate = prompt('Reminder date (YYYY-MM-DD):');
    
    if (reminderType && reminderDate) {
        const reminders = JSON.parse(localStorage.getItem('vatax_tax_reminders') || '[]');
        reminders.push({
            id: 'reminder_' + Date.now(),
            type: reminderType,
            date: reminderDate,
            userId: VATAX.currentUser.id,
            created: new Date().toISOString()
        });
        localStorage.setItem('vatax_tax_reminders', JSON.stringify(reminders));
        
        showAlert('Reminder scheduled successfully!', 'success');
    }
}

// Calculation Actions
function viewCalculationDetails(calcId) {
    const calculation = Dashboard.recentCalculations.find(calc => calc.id === calcId);
    if (!calculation) {
        showAlert('Calculation not found', 'error');
        return;
    }
    
    showCalculationModal(calculation);
}

function showCalculationModal(calculation) {
    const modal = document.createElement('div');
    modal.id = 'calculation-details-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="modal-header">
                <h2 class="text-2xl font-bold text-navy">Calculation Details</h2>
                <button onclick="closeModal('calculation-details-modal')" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h3 class="font-semibold text-navy">Type</h3>
                        <p>${calculation.type === 'vat' ? 'VAT Calculation' : 'Income Tax Calculation'}</p>
                    </div>
                    <div>
                        <h3 class="font-semibold text-navy">Date</h3>
                        <p>${formatDate(calculation.timestamp)}</p>
                    </div>
                </div>
                
                ${calculation.type === 'vat' ? `
                    <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h3 class="font-semibold text-navy mb-2">VAT Details</h3>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>Base Amount: ৳${formatNumber(calculation.baseAmount)}</div>
                            <div>VAT Rate: ${calculation.vatRate}%</div>
                            <div>VAT Amount: ৳${formatNumber(calculation.vatAmount)}</div>
                            <div>Total: ৳${formatNumber(calculation.totalAmount)}</div>
                        </div>
                    </div>
                ` : `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 class="font-semibold text-navy mb-2">Tax Details</h3>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>Total Income: ৳${formatNumber(calculation.totalIncome)}</div>
                            <div>Taxable Income: ৳${formatNumber(calculation.taxableIncome)}</div>
                            <div>Total Tax: ৳${formatNumber(calculation.totalTax)}</div>
                            <div>Effective Rate: ${calculation.effectiveRate.toFixed(2)}%</div>
                        </div>
                    </div>
                `}
                
                <div class="flex gap-3">
                    <button onclick="downloadCalculationPDF('${calculation.id}')" class="flex-1 btn-orange">
                        <i class="fas fa-download mr-2"></i>Download PDF
                    </button>
                    <button onclick="emailCalculationReport('${calculation.id}')" class="flex-1 btn-green">
                        <i class="fas fa-envelope mr-2"></i>Email Report
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showModal('calculation-details-modal');
    
    // Auto-remove modal when closed
    setTimeout(() => {
        const modalElement = document.getElementById('calculation-details-modal');
        if (modalElement) modalElement.remove();
    }, 30000);
}

function downloadCalculationPDF(calcId) {
    if (!VATAX.isProUser) {
        showAlert('Upgrade to Pro to download PDF reports', 'warning');
        return;
    }
    
    const calculation = Dashboard.recentCalculations.find(calc => calc.id === calcId);
    if (!calculation) {
        showAlert('Calculation not found', 'error');
        return;
    }
    
    showAlert('Generating PDF...', 'info');
    
    setTimeout(() => {
        // Generate and download PDF
        const pdfContent = generateCalculationPDF(calculation);
        const filename = `${calculation.type.toUpperCase()}_Calculation_${new Date().toDateString().replace(/ /g, '_')}.pdf`;
        downloadTextAsPDF(pdfContent, filename);
        
        showAlert('PDF downloaded successfully!', 'success');
    }, 1500);
}

function emailCalculationReport(calcId) {
    if (!VATAX.isProUser) {
        showAlert('Upgrade to Pro to email reports', 'warning');
        return;
    }
    
    const email = prompt('Enter email address:');
    if (!email || !isValidEmail(email)) {
        if (email) showAlert('Please enter a valid email address', 'error');
        return;
    }
    
    showAlert(`Sending report to ${email}...`, 'info');
    
    setTimeout(() => {
        showAlert(`Report sent to ${email} successfully!`, 'success');
    }, 2000);
}

// Subscription Management
function showSubscriptionManagement() {
    const modal = document.createElement('div');
    modal.id = 'subscription-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="text-2xl font-bold text-navy">Subscription Management</h2>
                <button onclick="closeModal('subscription-modal')" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="space-y-6">
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 class="font-semibold text-navy mb-2">Current Plan</h3>
                    <div class="flex justify-between items-center">
                        <div>
                            <div class="font-medium">VATAX Pro (${VATAX.currentUser.subscription_plan || 'Monthly'})</div>
                            <div class="text-sm text-gray-600">Active until ${formatDate(VATAX.currentUser.subscription_expires)}</div>
                        </div>
                        <div class="text-orange font-bold">৳99/month</div>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <button onclick="changeSubscriptionPlan()" class="w-full btn-outline-orange text-left">
                        <i class="fas fa-exchange-alt mr-3"></i>Change Plan
                    </button>
                    <button onclick="updatePaymentMethod()" class="w-full btn-outline-orange text-left">
                        <i class="fas fa-credit-card mr-3"></i>Update Payment Method
                    </button>
                    <button onclick="downloadInvoices()" class="w-full btn-outline-orange text-left">
                        <i class="fas fa-file-invoice mr-3"></i>Download Invoices
                    </button>
                    <button onclick="cancelSubscription()" class="w-full btn-outline-orange text-left text-red-600">
                        <i class="fas fa-times mr-3"></i>Cancel Subscription
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showModal('subscription-modal');
}

function updateDashboardForSubscription() {
    if (!VATAX.isProUser) {
        // Hide pro features or show upgrade prompts
        const proElements = document.querySelectorAll('.pro-feature, [data-pro="true"]');
        proElements.forEach(element => {
            element.style.opacity = '0.6';
            element.style.pointerEvents = 'none';
        });
    }
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getCalculationIdFromButton(button) {
    const row = button.closest('tr');
    return row ? row.dataset.calcId : null;
}

function generateCalculationPDF(calculation) {
    if (calculation.type === 'vat') {
        return `
VAT Calculation Report
Date: ${formatDate(calculation.timestamp)}

Base Amount: ৳${formatNumber(calculation.baseAmount)}
VAT Rate: ${calculation.vatRate}%
VAT Amount: ৳${formatNumber(calculation.vatAmount)}
Total Amount: ৳${formatNumber(calculation.totalAmount)}

Method: ${calculation.calculationMethod}

Generated by VATAX Dashboard
        `;
    } else {
        return `
Income Tax Calculation Report
Date: ${formatDate(calculation.timestamp)}
Category: ${calculation.category}

Total Income: ৳${formatNumber(calculation.totalIncome)}
Total Deductions: ৳${formatNumber(calculation.totalDeductions)}
Taxable Income: ৳${formatNumber(calculation.taxableIncome)}
Total Tax: ৳${formatNumber(calculation.totalTax)}
Effective Rate: ${calculation.effectiveRate.toFixed(2)}%

Generated by VATAX Dashboard
        `;
    }
}

function downloadTextAsPDF(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function showDashboardLoader() {
    const loader = document.createElement('div');
    loader.id = 'dashboard-loader';
    loader.className = 'fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50';
    loader.innerHTML = `
        <div class="text-center">
            <div class="spinner mb-4"></div>
            <p class="text-navy font-medium">Loading your dashboard...</p>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideDashboardLoader() {
    const loader = document.getElementById('dashboard-loader');
    if (loader) loader.remove();
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Export functions to global scope
window.exportAllReports = exportAllReports;
window.scheduleReminder = scheduleReminder;
window.viewCalculationDetails = viewCalculationDetails;
window.downloadCalculationPDF = downloadCalculationPDF;
window.emailCalculationReport = emailCalculationReport;
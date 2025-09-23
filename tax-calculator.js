// Tax Calculator JavaScript
// Handles all Income Tax calculation functionality for Bangladesh

// Tax Calculator State
const TaxCalculator = {
    currentCalculation: null,
    savedCalculations: [],
    taxSlabs: {},
    isCalculating: false
};

// Tax Slabs for different categories and years
const TAX_SLABS = {
    '2024-25': {
        individual: [
            { min: 0, max: 350000, rate: 0, description: 'Tax Free' },
            { min: 350000, max: 450000, rate: 5, description: '5% on next ৳1,00,000' },
            { min: 450000, max: 750000, rate: 10, description: '10% on next ৳3,00,000' },
            { min: 750000, max: 1150000, rate: 15, description: '15% on next ৳4,00,000' },
            { min: 1150000, max: 1650000, rate: 20, description: '20% on next ৳5,00,000' },
            { min: 1650000, max: Infinity, rate: 25, description: '25% on remaining amount' }
        ],
        female: [
            { min: 0, max: 400000, rate: 0, description: 'Tax Free' },
            { min: 400000, max: 500000, rate: 5, description: '5% on next ৳1,00,000' },
            { min: 500000, max: 800000, rate: 10, description: '10% on next ৳3,00,000' },
            { min: 800000, max: 1200000, rate: 15, description: '15% on next ৳4,00,000' },
            { min: 1200000, max: 1700000, rate: 20, description: '20% on next ৳5,00,000' },
            { min: 1700000, max: Infinity, rate: 25, description: '25% on remaining amount' }
        ],
        senior: [
            { min: 0, max: 450000, rate: 0, description: 'Tax Free' },
            { min: 450000, max: 550000, rate: 5, description: '5% on next ৳1,00,000' },
            { min: 550000, max: 850000, rate: 10, description: '10% on next ৳3,00,000' },
            { min: 850000, max: 1250000, rate: 15, description: '15% on next ৳4,00,000' },
            { min: 1250000, max: 1750000, rate: 20, description: '20% on next ৳5,00,000' },
            { min: 1750000, max: Infinity, rate: 25, description: '25% on remaining amount' }
        ]
    },
    '2023-24': {
        individual: [
            { min: 0, max: 300000, rate: 0, description: 'Tax Free' },
            { min: 300000, max: 400000, rate: 5, description: '5% on next ৳1,00,000' },
            { min: 400000, max: 700000, rate: 10, description: '10% on next ৳3,00,000' },
            { min: 700000, max: 1100000, rate: 15, description: '15% on next ৳4,00,000' },
            { min: 1100000, max: 1600000, rate: 20, description: '20% on next ৳5,00,000' },
            { min: 1600000, max: Infinity, rate: 25, description: '25% on remaining amount' }
        ],
        female: [
            { min: 0, max: 350000, rate: 0, description: 'Tax Free' },
            { min: 350000, max: 450000, rate: 5, description: '5% on next ৳1,00,000' },
            { min: 450000, max: 750000, rate: 10, description: '10% on next ৳3,00,000' },
            { min: 750000, max: 1150000, rate: 15, description: '15% on next ৳4,00,000' },
            { min: 1150000, max: 1650000, rate: 20, description: '20% on next ৳5,00,000' },
            { min: 1650000, max: Infinity, rate: 25, description: '25% on remaining amount' }
        ],
        senior: [
            { min: 0, max: 400000, rate: 0, description: 'Tax Free' },
            { min: 400000, max: 500000, rate: 5, description: '5% on next ৳1,00,000' },
            { min: 500000, max: 800000, rate: 10, description: '10% on next ৳3,00,000' },
            { min: 800000, max: 1200000, rate: 15, description: '15% on next ৳4,00,000' },
            { min: 1200000, max: 1700000, rate: 20, description: '20% on next ৳5,00,000' },
            { min: 1700000, max: Infinity, rate: 25, description: '25% on remaining amount' }
        ]
    }
};

// DOM Content Loaded Event for Tax Calculator
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('tax-calculator.html')) {
        initializeTaxCalculator();
    }
});

function initializeTaxCalculator() {
    setupTaxEventListeners();
    updateTaxSlabs();
    loadSavedTaxCalculations();
    updateTaxFormState();
}

function setupTaxEventListeners() {
    // Income inputs
    const incomeInputs = ['salary-income', 'business-income', 'rental-income', 'other-income'];
    incomeInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', debounce(calculateTax, 300));
        }
    });
    
    // Deduction inputs
    const deductionInputs = ['investment-deduction', 'zakat-deduction', 'donation-deduction', 'other-deduction'];
    deductionInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', debounce(calculateTax, 300));
        }
    });
    
    // Tax year and category changes
    const taxYearSelect = document.getElementById('tax-year');
    if (taxYearSelect) {
        taxYearSelect.addEventListener('change', updateTaxSlabs);
    }
    
    const categoryInputs = document.querySelectorAll('input[name="taxpayer-category"]');
    categoryInputs.forEach(input => {
        input.addEventListener('change', updateTaxSlabs);
    });
}

function updateTaxSlabs() {
    const taxYear = document.getElementById('tax-year').value;
    const category = document.querySelector('input[name="taxpayer-category"]:checked').value;
    
    // Update tax slabs information display
    const taxSlabsInfo = document.getElementById('tax-slabs-info');
    if (taxSlabsInfo) {
        const slabs = TAX_SLABS[taxYear][category];
        taxSlabsInfo.innerHTML = slabs.map(slab => `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                    <div class="font-semibold text-navy">${slab.description}</div>
                    <div class="text-sm text-gray-600">
                        ${slab.min === 0 ? '৳0' : `৳${formatNumber(slab.min)}`} - 
                        ${slab.max === Infinity ? 'Above' : `৳${formatNumber(slab.max)}`}
                    </div>
                </div>
                <div class="text-green font-bold">${slab.rate}%</div>
            </div>
        `).join('');
    }
    
    // Recalculate tax if there are values
    calculateTax();
}

function calculateTax() {
    if (TaxCalculator.isCalculating) return;
    
    TaxCalculator.isCalculating = true;
    
    // Get all income values
    const salaryIncome = parseFloat(document.getElementById('salary-income').value) || 0;
    const businessIncome = parseFloat(document.getElementById('business-income').value) || 0;
    const rentalIncome = parseFloat(document.getElementById('rental-income').value) || 0;
    const otherIncome = parseFloat(document.getElementById('other-income').value) || 0;
    
    const totalIncome = salaryIncome + businessIncome + rentalIncome + otherIncome;
    
    // Get all deduction values
    const investmentDeduction = parseFloat(document.getElementById('investment-deduction').value) || 0;
    const zakatDeduction = parseFloat(document.getElementById('zakat-deduction').value) || 0;
    const donationDeduction = parseFloat(document.getElementById('donation-deduction').value) || 0;
    const otherDeduction = parseFloat(document.getElementById('other-deduction').value) || 0;
    
    // Validate and limit deductions
    const maxInvestmentDeduction = Math.min(investmentDeduction, totalIncome * 0.25, 1500000);
    const maxDonationDeduction = Math.min(donationDeduction, totalIncome * 0.10);
    
    const totalDeductions = maxInvestmentDeduction + zakatDeduction + maxDonationDeduction + otherDeduction;
    
    // If no income entered, hide results
    if (totalIncome === 0) {
        hideTaxResults();
        TaxCalculator.isCalculating = false;
        return;
    }
    
    // Get tax year and category
    const taxYear = document.getElementById('tax-year').value;
    const category = document.querySelector('input[name="taxpayer-category"]:checked').value;
    
    // Calculate tax
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    const taxCalculation = calculateIncomeTaxDetailed(taxableIncome, category, taxYear);
    
    // Store current calculation
    TaxCalculator.currentCalculation = {
        totalIncome,
        totalDeductions,
        taxableIncome,
        ...taxCalculation,
        taxYear,
        category,
        timestamp: new Date().toISOString(),
        id: 'tax_calc_' + Date.now(),
        incomeBreakdown: {
            salary: salaryIncome,
            business: businessIncome,
            rental: rentalIncome,
            other: otherIncome
        },
        deductionBreakdown: {
            investment: maxInvestmentDeduction,
            zakat: zakatDeduction,
            donation: maxDonationDeduction,
            other: otherDeduction
        }
    };
    
    // Display results
    displayTaxResults(TaxCalculator.currentCalculation);
    
    // Track calculation for free users
    if (!VATAX.isProUser) {
        trackFreeCalculation();
    }
    
    TaxCalculator.isCalculating = false;
}

function calculateIncomeTaxDetailed(taxableIncome, category = 'individual', year = '2024-25') {
    const slabs = TAX_SLABS[year][category];
    let totalTax = 0;
    let remainingIncome = taxableIncome;
    const breakdown = [];
    
    for (const slab of slabs) {
        if (remainingIncome <= 0) break;
        
        const slabSize = slab.max - slab.min;
        const taxableInThisSlab = Math.min(remainingIncome, slabSize);
        const taxForThisSlab = (taxableInThisSlab * slab.rate) / 100;
        
        if (taxableInThisSlab > 0) {
            breakdown.push({
                range: `৳${formatNumber(slab.min)} - ${slab.max === Infinity ? 'Above' : '৳' + formatNumber(slab.max)}`,
                taxableAmount: taxableInThisSlab,
                rate: slab.rate,
                tax: taxForThisSlab,
                description: slab.description
            });
            
            totalTax += taxForThisSlab;
            remainingIncome -= taxableInThisSlab;
        }
        
        if (taxableIncome <= slab.max) break;
    }
    
    return {
        totalTax: Math.round(totalTax),
        effectiveRate: taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0,
        marginalRate: getMarginalRate(taxableIncome, slabs),
        breakdown: breakdown
    };
}

function getMarginalRate(taxableIncome, slabs) {
    for (const slab of slabs) {
        if (taxableIncome <= slab.max) {
            return slab.rate;
        }
    }
    return slabs[slabs.length - 1].rate;
}

function displayTaxResults(calculation) {
    // Show results panel
    const resultsPanel = document.getElementById('tax-calculation-results');
    const noResults = document.getElementById('no-tax-results');
    
    if (resultsPanel && noResults) {
        resultsPanel.classList.remove('hidden');
        noResults.classList.add('hidden');
    }
    
    // Update result values
    const resultElements = {
        'tax-result-total-income': calculation.totalIncome,
        'tax-result-deductions': calculation.totalDeductions,
        'tax-result-taxable': calculation.taxableIncome,
        'tax-result-liability': calculation.totalTax,
        'monthly-tax': Math.round(calculation.totalTax / 12)
    };
    
    Object.entries(resultElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = formatNumber(Math.round(value));
        }
    });
    
    // Update tax breakdown
    const breakdownElement = document.getElementById('tax-slab-breakdown');
    if (breakdownElement && calculation.breakdown) {
        breakdownElement.innerHTML = calculation.breakdown
            .map(item => `
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div class="text-sm">
                        <div class="font-medium">${item.description}</div>
                        <div class="text-xs text-gray-600">৳${formatNumber(item.taxableAmount)} × ${item.rate}%</div>
                    </div>
                    <div class="font-semibold text-green">৳${formatNumber(Math.round(item.tax))}</div>
                </div>
            `).join('');
    }
    
    // Add animation
    resultsPanel.classList.add('fade-in');
}

function hideTaxResults() {
    const resultsPanel = document.getElementById('tax-calculation-results');
    const noResults = document.getElementById('no-tax-results');
    
    if (resultsPanel && noResults) {
        resultsPanel.classList.add('hidden');
        noResults.classList.remove('hidden');
    }
}

function clearTaxCalculation() {
    // Clear all income inputs
    const incomeInputs = ['salary-income', 'business-income', 'rental-income', 'other-income'];
    incomeInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) input.value = '';
    });
    
    // Clear all deduction inputs
    const deductionInputs = ['investment-deduction', 'zakat-deduction', 'donation-deduction', 'other-deduction'];
    deductionInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) input.value = '';
    });
    
    // Reset to current year and individual category
    document.getElementById('tax-year').value = '2024-25';
    document.querySelector('input[name="taxpayer-category"][value="individual"]').checked = true;
    
    // Update tax slabs and hide results
    updateTaxSlabs();
    hideTaxResults();
    
    // Clear current calculation
    TaxCalculator.currentCalculation = null;
    
    showAlert('Tax calculation cleared', 'info');
}

// Pro Features for Tax Calculator
function saveTaxCalculation() {
    if (!VATAX.isProUser) {
        showUpgradePrompt('save tax calculations');
        return;
    }
    
    if (!TaxCalculator.currentCalculation) {
        showAlert('No calculation to save', 'warning');
        return;
    }
    
    const calculation = {
        ...TaxCalculator.currentCalculation,
        saved: true,
        userId: VATAX.currentUser?.id
    };
    
    // Save to local storage (in real app, save to database)
    const savedCalcs = JSON.parse(localStorage.getItem('vatax_saved_tax_calculations') || '[]');
    savedCalcs.push(calculation);
    localStorage.setItem('vatax_saved_tax_calculations', JSON.stringify(savedCalcs));
    
    TaxCalculator.savedCalculations.push(calculation);
    
    showAlert('Tax calculation saved successfully!', 'success');
}

function generateTaxReport() {
    if (!VATAX.isProUser) {
        showUpgradePrompt('generate tax reports');
        return;
    }
    
    if (!TaxCalculator.currentCalculation) {
        showAlert('No calculation to generate report', 'warning');
        return;
    }
    
    showAlert('Generating comprehensive tax report...', 'info');
    
    setTimeout(() => {
        const reportContent = generateTaxReportContent(TaxCalculator.currentCalculation);
        downloadPDF(reportContent, 'Income_Tax_Report.pdf');
        showAlert('Tax report generated successfully!', 'success');
    }, 2000);
}

function getTaxTips() {
    if (!VATAX.isProUser) {
        showUpgradePrompt('get personalized tax tips');
        return;
    }
    
    if (!TaxCalculator.currentCalculation) {
        showAlert('Calculate your tax first to get personalized tips', 'warning');
        return;
    }
    
    const tips = generateTaxSavingTips(TaxCalculator.currentCalculation);
    displayTaxTips(tips);
}

function scheduleTaxReminder() {
    if (!VATAX.isProUser) {
        showUpgradePrompt('schedule tax reminders');
        return;
    }
    
    const reminderModal = createReminderModal();
    document.body.appendChild(reminderModal);
    showModal(reminderModal.id);
}

function generateTaxSavingTips(calculation) {
    const tips = [];
    
    // Investment allowance tip
    const maxInvestment = Math.min(calculation.totalIncome * 0.25, 1500000);
    const currentInvestment = calculation.deductionBreakdown.investment;
    const remainingInvestment = maxInvestment - currentInvestment;
    
    if (remainingInvestment > 0) {
        const potentialSaving = remainingInvestment * (calculation.marginalRate / 100);
        tips.push({
            type: 'investment',
            title: 'Investment Allowance Opportunity',
            description: `You can invest ৳${formatNumber(remainingInvestment)} more to save ৳${formatNumber(potentialSaving)} in tax`,
            potentialSaving: potentialSaving,
            priority: 'high'
        });
    }
    
    // Donation tip
    const maxDonation = calculation.totalIncome * 0.10;
    const currentDonation = calculation.deductionBreakdown.donation;
    const remainingDonation = maxDonation - currentDonation;
    
    if (remainingDonation > 0) {
        const potentialSaving = remainingDonation * (calculation.marginalRate / 100);
        tips.push({
            type: 'donation',
            title: 'Charitable Donation Deduction',
            description: `Donate ৳${formatNumber(remainingDonation)} to save ৳${formatNumber(potentialSaving)} in tax`,
            potentialSaving: potentialSaving,
            priority: 'medium'
        });
    }
    
    // Advance tax payment tip
    if (calculation.totalTax > 5000) {
        tips.push({
            type: 'advance_tax',
            title: 'Advance Tax Payment',
            description: 'Pay advance tax in quarterly installments to avoid penalties and manage cash flow',
            priority: 'medium'
        });
    }
    
    return tips;
}

function displayTaxTips(tips) {
    const tipModal = document.createElement('div');
    tipModal.id = 'tax-tips-modal';
    tipModal.className = 'modal';
    tipModal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="modal-header">
                <h2 class="text-2xl font-bold text-navy">Personalized Tax Saving Tips</h2>
                <button onclick="closeModal('tax-tips-modal')" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="space-y-4">
                ${tips.map(tip => `
                    <div class="p-4 border border-gray-200 rounded-lg ${tip.priority === 'high' ? 'border-green-400 bg-green-50' : 'bg-gray-50'}">
                        <h3 class="font-semibold text-navy mb-2">${tip.title}</h3>
                        <p class="text-gray-700 mb-2">${tip.description}</p>
                        ${tip.potentialSaving ? `<div class="text-green font-semibold">Potential Savings: ৳${formatNumber(tip.potentialSaving)}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            <div class="mt-6">
                <button onclick="closeModal('tax-tips-modal')" class="w-full btn-primary">Got It!</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(tipModal);
    showModal('tax-tips-modal');
    
    // Remove modal after closing
    setTimeout(() => {
        const modal = document.getElementById('tax-tips-modal');
        if (modal) modal.remove();
    }, 300000); // Remove after 5 minutes
}

function createReminderModal() {
    const modal = document.createElement('div');
    modal.id = 'reminder-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="text-2xl font-bold text-navy">Schedule Tax Reminder</h2>
                <button onclick="closeModal('reminder-modal')" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="reminder-form" class="space-y-4">
                <div>
                    <label class="form-label">Reminder Type</label>
                    <select id="reminder-type" class="form-input">
                        <option value="tax_return">Income Tax Return Filing</option>
                        <option value="advance_tax">Advance Tax Payment</option>
                        <option value="investment">Investment Deadline</option>
                        <option value="custom">Custom Reminder</option>
                    </select>
                </div>
                <div>
                    <label class="form-label">Reminder Date</label>
                    <input type="date" id="reminder-date" class="form-input" required>
                </div>
                <div>
                    <label class="form-label">Custom Message (Optional)</label>
                    <textarea id="reminder-message" class="form-input" rows="3" placeholder="Enter custom reminder message"></textarea>
                </div>
                <div>
                    <label class="flex items-center">
                        <input type="checkbox" id="email-reminder" class="mr-2">
                        <span>Send email reminder</span>
                    </label>
                </div>
                <button type="submit" class="w-full btn-green">Schedule Reminder</button>
            </form>
        </div>
    `;
    
    const form = modal.querySelector('#reminder-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        scheduleReminder();
        closeModal('reminder-modal');
        modal.remove();
    });
    
    return modal;
}

function scheduleReminder() {
    const reminderType = document.getElementById('reminder-type').value;
    const reminderDate = document.getElementById('reminder-date').value;
    const reminderMessage = document.getElementById('reminder-message').value;
    const emailReminder = document.getElementById('email-reminder').checked;
    
    // Save reminder (in real app, save to database)
    const reminders = JSON.parse(localStorage.getItem('vatax_tax_reminders') || '[]');
    reminders.push({
        id: 'reminder_' + Date.now(),
        type: reminderType,
        date: reminderDate,
        message: reminderMessage,
        email: emailReminder,
        userId: VATAX.currentUser?.id,
        created: new Date().toISOString()
    });
    localStorage.setItem('vatax_tax_reminders', JSON.stringify(reminders));
    
    showAlert('Tax reminder scheduled successfully!', 'success');
}

function generateTaxReportContent(calculation) {
    return `
        Income Tax Calculation Report
        Assessment Year: ${calculation.taxYear}
        Taxpayer Category: ${calculation.category.charAt(0).toUpperCase() + calculation.category.slice(1)}
        Date: ${new Date().toLocaleDateString()}
        
        Income Breakdown:
        - Salary Income: ৳${formatNumber(calculation.incomeBreakdown.salary)}
        - Business Income: ৳${formatNumber(calculation.incomeBreakdown.business)}
        - Rental Income: ৳${formatNumber(calculation.incomeBreakdown.rental)}
        - Other Income: ৳${formatNumber(calculation.incomeBreakdown.other)}
        Total Income: ৳${formatNumber(calculation.totalIncome)}
        
        Deductions:
        - Investment Allowance: ৳${formatNumber(calculation.deductionBreakdown.investment)}
        - Zakat Payment: ৳${formatNumber(calculation.deductionBreakdown.zakat)}
        - Charitable Donations: ৳${formatNumber(calculation.deductionBreakdown.donation)}
        - Other Deductions: ৳${formatNumber(calculation.deductionBreakdown.other)}
        Total Deductions: ৳${formatNumber(calculation.totalDeductions)}
        
        Tax Calculation:
        Taxable Income: ৳${formatNumber(calculation.taxableIncome)}
        Total Tax Liability: ৳${formatNumber(calculation.totalTax)}
        Effective Tax Rate: ${calculation.effectiveRate.toFixed(2)}%
        Monthly Tax: ৳${formatNumber(Math.round(calculation.totalTax / 12))}
        
        Tax Slab Breakdown:
        ${calculation.breakdown.map(item => 
            `${item.description}: ৳${formatNumber(Math.round(item.tax))}`
        ).join('\n')}
        
        Generated by VATAX - Smart Tax Calculator for Bangladesh
    `;
}

// Helper Functions
function loadSavedTaxCalculations() {
    if (VATAX.isProUser) {
        const savedCalcs = JSON.parse(localStorage.getItem('vatax_saved_tax_calculations') || '[]');
        TaxCalculator.savedCalculations = savedCalcs;
    }
}

function updateTaxFormState() {
    // Enable/disable pro features based on user subscription
    const proButtons = document.querySelectorAll('#tax-pro-features button');
    
    proButtons.forEach(button => {
        if (VATAX.isProUser) {
            button.disabled = false;
            button.classList.remove('opacity-50');
        } else {
            button.disabled = true;
            button.classList.add('opacity-50');
        }
    });
}

// Export functions to global scope
window.calculateTax = calculateTax;
window.clearTaxCalculation = clearTaxCalculation;
window.saveTaxCalculation = saveTaxCalculation;
window.generateTaxReport = generateTaxReport;
window.getTaxTips = getTaxTips;
window.scheduleTaxReminder = scheduleTaxReminder;
window.updateTaxSlabs = updateTaxSlabs;
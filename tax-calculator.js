// Tax Calculator JavaScript - Netlify compatible
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
    }
};

// DOM Content Loaded Event for Tax Calculator
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('tax-calculator.html') || 
        document.getElementById('tax-calculator-section')) {
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
    
    // Add button events
    const clearButton = document.querySelector('[onclick="clearTaxCalculation()"]');
    if (clearButton) {
        clearButton.addEventListener('click', clearTaxCalculation);
    }
    
    const saveButton = document.querySelector('[onclick="saveTaxCalculation()"]');
    if (saveButton) {
        saveButton.addEventListener('click', saveTaxCalculation);
    }
}

function updateTaxSlabs() {
    const taxYearSelect = document.getElementById('tax-year');
    const categoryInput = document.querySelector('input[name="taxpayer-category"]:checked');
    
    if (!taxYearSelect || !categoryInput) return;
    
    const taxYear = taxYearSelect.value;
    const category = categoryInput.value;
    
    // Update tax slabs information display
    const taxSlabsInfo = document.getElementById('tax-slabs-info');
    if (taxSlabsInfo) {
        const slabs = TAX_SLABS[taxYear]?.[category] || TAX_SLABS['2024-25'].individual;
        taxSlabsInfo.innerHTML = slabs.map(slab => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 8px;">
                <div>
                    <div style="font-weight: 600; color: #1e3a8a;">${slab.description}</div>
                    <div style="font-size: 14px; color: #6b7280;">
                        ${slab.min === 0 ? '৳0' : `৳${formatNumber(slab.min)}`} - 
                        ${slab.max === Infinity ? 'Above' : `৳${formatNumber(slab.max)}`}
                    </div>
                </div>
                <div style="color: #228B22; font-weight: bold;">${slab.rate}%</div>
            </div>
        `).join('');
    }
    
    calculateTax();
}

function calculateTax() {
    if (TaxCalculator.isCalculating) return;
    
    TaxCalculator.isCalculating = true;
    
    // Get all income values
    const salaryIncome = parseFloat(document.getElementById('salary-income')?.value) || 0;
    const businessIncome = parseFloat(document.getElementById('business-income')?.value) || 0;
    const rentalIncome = parseFloat(document.getElementById('rental-income')?.value) || 0;
    const otherIncome = parseFloat(document.getElementById('other-income')?.value) || 0;
    
    const totalIncome = salaryIncome + businessIncome + rentalIncome + otherIncome;
    
    // Get all deduction values
    const investmentDeduction = parseFloat(document.getElementById('investment-deduction')?.value) || 0;
    const zakatDeduction = parseFloat(document.getElementById('zakat-deduction')?.value) || 0;
    const donationDeduction = parseFloat(document.getElementById('donation-deduction')?.value) || 0;
    const otherDeduction = parseFloat(document.getElementById('other-deduction')?.value) || 0;
    
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
    const taxYearSelect = document.getElementById('tax-year');
    const categoryInput = document.querySelector('input[name="taxpayer-category"]:checked');
    
    if (!taxYearSelect || !categoryInput) {
        TaxCalculator.isCalculating = false;
        return;
    }
    
    const taxYear = taxYearSelect.value;
    const category = categoryInput.value;
    
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
    const slabs = TAX_SLABS[year]?.[category] || TAX_SLABS['2024-25'].individual;
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
        resultsPanel.style.display = 'block';
        noResults.style.display = 'none';
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
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #f9fafb; border-radius: 4px; margin-bottom: 4px;">
                    <div style="font-size: 14px;">
                        <div style="font-weight: 500;">${item.description}</div>
                        <div style="font-size: 12px; color: #6b7280;">৳${formatNumber(item.taxableAmount)} × ${item.rate}%</div>
                    </div>
                    <div style="font-weight: 600; color: #228B22;">৳${formatNumber(Math.round(item.tax))}</div>
                </div>
            `).join('');
    }
}

function hideTaxResults() {
    const resultsPanel = document.getElementById('tax-calculation-results');
    const noResults = document.getElementById('no-tax-results');
    
    if (resultsPanel && noResults) {
        resultsPanel.style.display = 'none';
        noResults.style.display = 'block';
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
    const taxYearSelect = document.getElementById('tax-year');
    const individualRadio = document.querySelector('input[name="taxpayer-category"][value="individual"]');
    
    if (taxYearSelect) taxYearSelect.value = '2024-25';
    if (individualRadio) individualRadio.checked = true;
    
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
    
    // Save to local storage
    try {
        const savedCalcs = JSON.parse(localStorage.getItem('vatax_saved_tax_calculations') || '[]');
        savedCalcs.push(calculation);
        localStorage.setItem('vatax_saved_tax_calculations', JSON.stringify(savedCalcs));
        
        TaxCalculator.savedCalculations.push(calculation);
        showAlert('Tax calculation saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving tax calculation:', error);
        showAlert('Error saving calculation', 'error');
    }
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

// Helper Functions
function loadSavedTaxCalculations() {
    if (VATAX.isProUser) {
        try {
            const savedCalcs = JSON.parse(localStorage.getItem('vatax_saved_tax_calculations') || '[]');
            TaxCalculator.savedCalculations = savedCalcs;
        } catch (error) {
            console.error('Error loading saved tax calculations:', error);
        }
    }
}

function updateTaxFormState() {
    // Enable/disable pro features based on user subscription
    const proButtons = document.querySelectorAll('.tax-pro-feature');
    
    proButtons.forEach(button => {
        if (VATAX.isProUser) {
            button.disabled = false;
            button.style.opacity = '1';
        } else {
            button.disabled = true;
            button.style.opacity = '0.5';
        }
    });
}

function showUpgradePrompt(feature) {
    showAlert(`Upgrade to VATAX Pro to ${feature} and unlock more advanced features!`, 'info');
    
    setTimeout(() => {
        if (confirm(`Would you like to upgrade to Pro to access ${feature}?`)) {
            window.location.href = 'pricing.html?upgrade=true';
        }
    }, 1000);
}

// Export functions to global scope
window.calculateTax = calculateTax;
window.clearTaxCalculation = clearTaxCalculation;
window.saveTaxCalculation = saveTaxCalculation;
window.generateTaxReport = generateTaxReport;
window.getTaxTips = getTaxTips;
window.scheduleTaxReminder = scheduleTaxReminder;
window.updateTaxSlabs = updateTaxSlabs;
window.TaxCalculator = TaxCalculator;

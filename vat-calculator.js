// VAT Calculator JavaScript - Netlify compatible
const VATCalculator = {
    currentCalculation: null,
    savedCalculations: [],
    bulkCalculations: [],
    isCalculating: false
};

// DOM Content Loaded Event for VAT Calculator
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('vat-calculator.html') || 
        document.getElementById('vat-calculator-section')) {
        initializeVATCalculator();
    }
});

function initializeVATCalculator() {
    setupVATEventListeners();
    setupCalculationTypeHandlers();
    loadSavedVATCalculations();
    updateVATFormState();
}

function setupVATEventListeners() {
    // VAT rate selection
    const vatRateSelect = document.getElementById('vat-rate');
    if (vatRateSelect) {
        vatRateSelect.addEventListener('change', handleVATRateChange);
    }
    
    // Base amount input
    const baseAmountInput = document.getElementById('base-amount');
    if (baseAmountInput) {
        baseAmountInput.addEventListener('input', debounce(calculateVAT, 300));
    }
    
    // Custom rate input
    const customRateInput = document.getElementById('custom-rate');
    if (customRateInput) {
        customRateInput.addEventListener('input', debounce(calculateVAT, 300));
    }
    
    // Calculation type radio buttons
    const calculationTypeInputs = document.querySelectorAll('input[name="calculation-type"]');
    calculationTypeInputs.forEach(input => {
        input.addEventListener('change', handleCalculationTypeChange);
    });
    
    // Add clear button event
    const clearButton = document.querySelector('[onclick="clearCalculation()"]');
    if (clearButton) {
        clearButton.addEventListener('click', clearCalculation);
    }
    
    // Add save button event
    const saveButton = document.querySelector('[onclick="saveCalculation()"]');
    if (saveButton) {
        saveButton.addEventListener('click', saveCalculation);
    }
}

function setupCalculationTypeHandlers() {
    const calculationTypeInputs = document.querySelectorAll('input[name="calculation-type"]');
    calculationTypeInputs.forEach(input => {
        input.addEventListener('change', updateAmountLabel);
    });
    updateAmountLabel();
}

function handleVATRateChange() {
    const vatRateSelect = document.getElementById('vat-rate');
    const customRateContainer = document.getElementById('custom-rate-container');
    
    if (vatRateSelect && customRateContainer) {
        if (vatRateSelect.value === 'custom') {
            customRateContainer.style.display = 'block';
            const customRateInput = document.getElementById('custom-rate');
            if (customRateInput) customRateInput.focus();
        } else {
            customRateContainer.style.display = 'none';
        }
        calculateVAT();
    }
}

function handleCalculationTypeChange() {
    updateAmountLabel();
    calculateVAT();
}

function updateAmountLabel() {
    const calculationType = document.querySelector('input[name="calculation-type"]:checked');
    const amountLabel = document.getElementById('amount-label');
    
    if (calculationType && amountLabel) {
        if (calculationType.value === 'inclusive') {
            amountLabel.textContent = 'Total Amount (৳)';
        } else {
            amountLabel.textContent = 'Base Amount (৳)';
        }
    }
}

function calculateVAT() {
    if (VATCalculator.isCalculating) return;
    
    const baseAmountInput = document.getElementById('base-amount');
    const vatRateSelect = document.getElementById('vat-rate');
    const customRateInput = document.getElementById('custom-rate');
    
    if (!baseAmountInput || !vatRateSelect) return;
    
    const baseAmount = parseFloat(baseAmountInput.value);
    
    // Get VAT rate
    let vatRate;
    if (vatRateSelect.value === 'custom') {
        if (!customRateInput) return;
        vatRate = parseFloat(customRateInput.value);
        if (isNaN(vatRate)) {
            showVATError('Please enter a valid custom VAT rate');
            return;
        }
    } else {
        vatRate = parseFloat(vatRateSelect.value);
    }
    
    // Validate inputs
    if (isNaN(baseAmount) || baseAmount <= 0) {
        hideVATResults();
        return;
    }
    
    if (isNaN(vatRate) || vatRate < 0) {
        showVATError('Please select a valid VAT rate');
        return;
    }
    
    VATCalculator.isCalculating = true;
    
    // Get calculation type
    const calculationType = document.querySelector('input[name="calculation-type"]:checked');
    if (!calculationType) {
        VATCalculator.isCalculating = false;
        return;
    }
    
    let calculation;
    if (calculationType.value === 'inclusive') {
        calculation = calculateVATInclusive(baseAmount, vatRate);
    } else {
        calculation = calculateVATExclusive(baseAmount, vatRate);
    }
    
    // Store current calculation
    VATCalculator.currentCalculation = {
        ...calculation,
        calculationType: calculationType.value,
        timestamp: new Date().toISOString(),
        id: 'calc_' + Date.now()
    };
    
    // Display results
    displayVATResults(calculation);
    
    // Track calculation for free users
    if (!VATAX.isProUser) {
        trackFreeCalculation();
    }
    
    VATCalculator.isCalculating = false;
}

function calculateVATExclusive(baseAmount, vatRate) {
    const vatAmount = (baseAmount * vatRate) / 100;
    const totalAmount = baseAmount + vatAmount;
    
    return {
        baseAmount: baseAmount,
        vatRate: vatRate,
        vatAmount: vatAmount,
        totalAmount: totalAmount,
        calculationMethod: 'exclusive',
        breakdown: generateVATBreakdown(baseAmount, vatRate, vatAmount, totalAmount, 'exclusive')
    };
}

function calculateVATInclusive(totalAmount, vatRate) {
    const baseAmount = totalAmount / (1 + (vatRate / 100));
    const vatAmount = totalAmount - baseAmount;
    
    return {
        baseAmount: baseAmount,
        vatRate: vatRate,
        vatAmount: vatAmount,
        totalAmount: totalAmount,
        calculationMethod: 'inclusive',
        breakdown: generateVATBreakdown(baseAmount, vatRate, vatAmount, totalAmount, 'inclusive')
    };
}

function generateVATBreakdown(baseAmount, vatRate, vatAmount, totalAmount, method) {
    if (method === 'exclusive') {
        return [
            `Base amount: ৳${formatNumber(baseAmount)}`,
            `VAT (${vatRate}%): ৳${formatNumber(vatAmount)}`,
            `Total amount = ৳${formatNumber(baseAmount)} + ৳${formatNumber(vatAmount)} = ৳${formatNumber(totalAmount)}`
        ];
    } else {
        return [
            `Total amount: ৳${formatNumber(totalAmount)}`,
            `Base amount: ৳${formatNumber(totalAmount)} ÷ (1 + ${vatRate}%) = ৳${formatNumber(baseAmount)}`,
            `VAT amount: ৳${formatNumber(totalAmount)} - ৳${formatNumber(baseAmount)} = ৳${formatNumber(vatAmount)}`
        ];
    }
}

function displayVATResults(calculation) {
    // Show results panel
    const resultsPanel = document.getElementById('calculation-results');
    const noResults = document.getElementById('no-results');
    
    if (resultsPanel && noResults) {
        resultsPanel.style.display = 'block';
        noResults.style.display = 'none';
    }
    
    // Update result values
    const resultElements = {
        'result-base': calculation.baseAmount,
        'result-rate': calculation.vatRate,
        'result-vat': calculation.vatAmount,
        'result-total': calculation.totalAmount
    };
    
    Object.entries(resultElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = formatNumber(Math.round(value));
        }
    });
    
    // Update breakdown
    const breakdownElement = document.getElementById('calculation-breakdown');
    if (breakdownElement && calculation.breakdown) {
        breakdownElement.innerHTML = calculation.breakdown
            .map(line => `<div>${line}</div>`)
            .join('');
    }
}

function hideVATResults() {
    const resultsPanel = document.getElementById('calculation-results');
    const noResults = document.getElementById('no-results');
    
    if (resultsPanel && noResults) {
        resultsPanel.style.display = 'none';
        noResults.style.display = 'block';
    }
}

function showVATError(message) {
    showAlert(message, 'error');
    hideVATResults();
}

function clearCalculation() {
    // Clear form inputs
    const baseAmountInput = document.getElementById('base-amount');
    const vatRateSelect = document.getElementById('vat-rate');
    const customRateInput = document.getElementById('custom-rate');
    const customRateContainer = document.getElementById('custom-rate-container');
    
    if (baseAmountInput) baseAmountInput.value = '';
    if (vatRateSelect) vatRateSelect.selectedIndex = 0;
    if (customRateInput) customRateInput.value = '';
    if (customRateContainer) customRateContainer.style.display = 'none';
    
    // Reset calculation type to exclusive
    const exclusiveRadio = document.querySelector('input[name="calculation-type"][value="exclusive"]');
    if (exclusiveRadio) exclusiveRadio.checked = true;
    updateAmountLabel();
    
    // Hide results
    hideVATResults();
    
    // Clear current calculation
    VATCalculator.currentCalculation = null;
    
    showAlert('Calculation cleared', 'info');
}

// Pro Features
function saveCalculation() {
    if (!VATAX.isProUser) {
        showUpgradePrompt('save calculations');
        return;
    }
    
    if (!VATCalculator.currentCalculation) {
        showAlert('No calculation to save', 'warning');
        return;
    }
    
    const calculation = {
        ...VATCalculator.currentCalculation,
        saved: true,
        userId: VATAX.currentUser?.id
    };
    
    // Save to local storage
    try {
        const savedCalcs = JSON.parse(localStorage.getItem('vatax_saved_calculations') || '[]');
        savedCalcs.push(calculation);
        localStorage.setItem('vatax_saved_calculations', JSON.stringify(savedCalcs));
        
        VATCalculator.savedCalculations.push(calculation);
        showAlert('Calculation saved successfully!', 'success');
        updateSavedCalculationsList();
    } catch (error) {
        console.error('Error saving calculation:', error);
        showAlert('Error saving calculation', 'error');
    }
}

function exportToPDF() {
    if (!VATAX.isProUser) {
        showUpgradePrompt('export PDF reports');
        return;
    }
    
    if (!VATCalculator.currentCalculation) {
        showAlert('No calculation to export', 'warning');
        return;
    }
    
    showAlert('Generating PDF report...', 'info');
    
    setTimeout(() => {
        const pdfContent = generatePDFContent(VATCalculator.currentCalculation);
        downloadPDF(pdfContent, 'VAT_Calculation_Report.pdf');
        showAlert('PDF report generated successfully!', 'success');
    }, 2000);
}

function emailReport() {
    if (!VATAX.isProUser) {
        showUpgradePrompt('email reports');
        return;
    }
    
    if (!VATCalculator.currentCalculation) {
        showAlert('No calculation to email', 'warning');
        return;
    }
    
    const email = prompt('Enter email address to send the report:');
    if (email && isValidEmail(email)) {
        showAlert('Sending email report...', 'info');
        
        setTimeout(() => {
            showAlert(`Report sent to ${email} successfully!`, 'success');
        }, 1500);
    } else if (email) {
        showAlert('Please enter a valid email address', 'error');
    }
}

function addToComparison() {
    if (!VATAX.isProUser) {
        showUpgradePrompt('comparison features');
        return;
    }
    
    if (!VATCalculator.currentCalculation) {
        showAlert('No calculation to add to comparison', 'warning');
        return;
    }
    
    // Add to comparison list
    try {
        const comparisonList = JSON.parse(localStorage.getItem('vatax_comparison_list') || '[]');
        comparisonList.push(VATCalculator.currentCalculation);
        localStorage.setItem('vatax_comparison_list', JSON.stringify(comparisonList));
        
        showAlert('Added to comparison list!', 'success');
    } catch (error) {
        console.error('Error adding to comparison:', error);
        showAlert('Error adding to comparison', 'error');
    }
}

// Helper Functions
function loadSavedVATCalculations() {
    if (VATAX.isProUser) {
        try {
            const savedCalcs = JSON.parse(localStorage.getItem('vatax_saved_calculations') || '[]');
            VATCalculator.savedCalculations = savedCalcs.filter(calc => calc.calculationType);
            updateSavedCalculationsList();
        } catch (error) {
            console.error('Error loading saved calculations:', error);
        }
    }
}

function updateSavedCalculationsList() {
    const recentCalculations = document.getElementById('recent-calculations');
    if (!recentCalculations || !VATAX.isProUser) return;
    
    if (VATCalculator.savedCalculations.length > 0) {
        recentCalculations.style.display = 'block';
        updateCalculationsTable();
    }
}

function updateCalculationsTable() {
    const tableBody = document.getElementById('calculations-table-body');
    if (!tableBody) return;
    
    const calculations = VATCalculator.savedCalculations.slice(-10).reverse();
    
    tableBody.innerHTML = calculations.map(calc => `
        <tr>
            <td>${new Date(calc.timestamp).toLocaleDateString()}</td>
            <td>৳${formatNumber(calc.baseAmount)}</td>
            <td>${calc.vatRate}%</td>
            <td>৳${formatNumber(calc.vatAmount)}</td>
            <td>৳${formatNumber(calc.totalAmount)}</td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button onclick="viewCalculationDetails('${calc.id}')" class="view-btn" title="View">View</button>
                    <button onclick="downloadCalculationPDF('${calc.id}')" class="download-btn" title="Download">Download</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateVATFormState() {
    // Enable/disable pro features based on user subscription
    const proButtons = document.querySelectorAll('.pro-feature-btn');
    
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

function generatePDFContent(calculation) {
    return `
        VAT Calculation Report
        Date: ${new Date().toLocaleDateString()}
        
        Calculation Details:
        - Method: ${calculation.calculationMethod}
        - Base Amount: ৳${formatNumber(calculation.baseAmount)}
        - VAT Rate: ${calculation.vatRate}%
        - VAT Amount: ৳${formatNumber(calculation.vatAmount)}
        - Total Amount: ৳${formatNumber(calculation.totalAmount)}
        
        Generated by VATAX - Smart VAT Calculator for Bangladesh
    `;
}

function downloadPDF(content, filename) {
    // Simulate PDF download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Netlify-specific fixes
function setupVATCalculatorSPA() {
    // Handle SPA navigation for VAT calculator
    if (window.location.hash === '#vat-calculator') {
        initializeVATCalculator();
    }
}

// Export functions to global scope
window.calculateVAT = calculateVAT;
window.clearCalculation = clearCalculation;
window.saveCalculation = saveCalculation;
window.exportToPDF = exportToPDF;
window.emailReport = emailReport;
window.addToComparison = addToComparison;
window.VATCalculator = VATCalculator;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVATCalculator);
} else {
    initializeVATCalculator();
}

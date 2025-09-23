// VAT Calculator JavaScript
// Handles all VAT calculation functionality and UI interactions

// VAT Calculator State
const VATCalculator = {
    currentCalculation: null,
    savedCalculations: [],
    bulkCalculations: [],
    isCalculating: false
};

// DOM Content Loaded Event for VAT Calculator
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('vat-calculator.html')) {
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
}

function setupCalculationTypeHandlers() {
    const calculationTypeInputs = document.querySelectorAll('input[name="calculation-type"]');
    calculationTypeInputs.forEach(input => {
        input.addEventListener('change', updateAmountLabel);
    });
    updateAmountLabel(); // Initial update
}

function handleVATRateChange() {
    const vatRateSelect = document.getElementById('vat-rate');
    const customRateContainer = document.getElementById('custom-rate-container');
    
    if (vatRateSelect.value === 'custom') {
        customRateContainer.classList.remove('hidden');
        const customRateInput = document.getElementById('custom-rate');
        customRateInput.focus();
    } else {
        customRateContainer.classList.add('hidden');
    }
    
    calculateVAT();
}

function handleCalculationTypeChange() {
    updateAmountLabel();
    calculateVAT();
}

function updateAmountLabel() {
    const calculationType = document.querySelector('input[name="calculation-type"]:checked').value;
    const amountLabel = document.getElementById('amount-label');
    
    if (calculationType === 'inclusive') {
        amountLabel.textContent = 'Total Amount (৳)';
    } else {
        amountLabel.textContent = 'Base Amount (৳)';
    }
}

function calculateVAT() {
    if (VATCalculator.isCalculating) return;
    
    const baseAmountInput = document.getElementById('base-amount');
    const vatRateSelect = document.getElementById('vat-rate');
    const customRateInput = document.getElementById('custom-rate');
    
    const baseAmount = parseFloat(baseAmountInput.value);
    
    // Get VAT rate
    let vatRate;
    if (vatRateSelect.value === 'custom') {
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
    const calculationType = document.querySelector('input[name="calculation-type"]:checked').value;
    
    let calculation;
    if (calculationType === 'inclusive') {
        calculation = calculateVATInclusive(baseAmount, vatRate);
    } else {
        calculation = calculateVATExclusive(baseAmount, vatRate);
    }
    
    // Store current calculation
    VATCalculator.currentCalculation = {
        ...calculation,
        calculationType,
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
        resultsPanel.classList.remove('hidden');
        noResults.classList.add('hidden');
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
    
    // Add animation
    resultsPanel.classList.add('fade-in');
}

function hideVATResults() {
    const resultsPanel = document.getElementById('calculation-results');
    const noResults = document.getElementById('no-results');
    
    if (resultsPanel && noResults) {
        resultsPanel.classList.add('hidden');
        noResults.classList.remove('hidden');
    }
}

function showVATError(message) {
    showAlert(message, 'error');
    hideVATResults();
}

function clearCalculation() {
    // Clear form inputs
    document.getElementById('base-amount').value = '';
    document.getElementById('vat-rate').selectedIndex = 0;
    document.getElementById('custom-rate').value = '';
    document.getElementById('custom-rate-container').classList.add('hidden');
    
    // Reset calculation type to exclusive
    document.querySelector('input[name="calculation-type"][value="exclusive"]').checked = true;
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
    
    // Save to local storage (in real app, save to database)
    const savedCalcs = JSON.parse(localStorage.getItem('vatax_saved_calculations') || '[]');
    savedCalcs.push(calculation);
    localStorage.setItem('vatax_saved_calculations', JSON.stringify(savedCalcs));
    
    VATCalculator.savedCalculations.push(calculation);
    
    showAlert('Calculation saved successfully!', 'success');
    updateSavedCalculationsList();
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
    
    // Simulate PDF generation
    showAlert('Generating PDF report...', 'info');
    
    setTimeout(() => {
        // In a real application, this would generate and download a PDF
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
    const comparisonList = JSON.parse(localStorage.getItem('vatax_comparison_list') || '[]');
    comparisonList.push(VATCalculator.currentCalculation);
    localStorage.setItem('vatax_comparison_list', JSON.stringify(comparisonList));
    
    showAlert('Added to comparison list!', 'success');
}

// Bulk Calculator Functions
function showBulkCalculator() {
    if (!VATAX.isProUser) {
        showUpgradePrompt('bulk calculations');
        return;
    }
    
    const bulkCalculator = document.getElementById('bulk-calculator');
    if (bulkCalculator) {
        bulkCalculator.classList.remove('hidden');
        addBulkInput();
    }
}

function addBulkInput() {
    const bulkInputs = document.getElementById('bulk-inputs');
    const inputIndex = VATCalculator.bulkCalculations.length;
    
    const inputHtml = `
        <div class="bulk-input-row mb-4 p-4 border border-gray-200 rounded-lg" data-index="${inputIndex}">
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <label class="form-label">Amount (৳)</label>
                    <input type="number" class="form-input bulk-amount" placeholder="Enter amount">
                </div>
                <div>
                    <label class="form-label">VAT Rate (%)</label>
                    <select class="form-input bulk-rate">
                        <option value="15">15%</option>
                        <option value="7.5">7.5%</option>
                        <option value="5">5%</option>
                        <option value="0">0%</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button type="button" onclick="removeBulkInput(${inputIndex})" class="btn-outline-orange">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="bulk-result mt-2 hidden">
                <div class="text-sm text-gray-600">
                    VAT: ৳<span class="bulk-vat-amount">0</span> | 
                    Total: ৳<span class="bulk-total-amount">0</span>
                </div>
            </div>
        </div>
    `;
    
    bulkInputs.insertAdjacentHTML('beforeend', inputHtml);
    
    // Add event listeners for the new inputs
    const newRow = bulkInputs.lastElementChild;
    const amountInput = newRow.querySelector('.bulk-amount');
    const rateInput = newRow.querySelector('.bulk-rate');
    
    amountInput.addEventListener('input', () => calculateBulkRow(inputIndex));
    rateInput.addEventListener('change', () => calculateBulkRow(inputIndex));
    
    VATCalculator.bulkCalculations.push({});
}

function removeBulkInput(index) {
    const row = document.querySelector(`[data-index="${index}"]`);
    if (row) {
        row.remove();
        VATCalculator.bulkCalculations.splice(index, 1);
    }
}

function calculateBulkRow(index) {
    const row = document.querySelector(`[data-index="${index}"]`);
    if (!row) return;
    
    const amountInput = row.querySelector('.bulk-amount');
    const rateInput = row.querySelector('.bulk-rate');
    const resultDiv = row.querySelector('.bulk-result');
    
    const amount = parseFloat(amountInput.value);
    const rate = parseFloat(rateInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        resultDiv.classList.add('hidden');
        return;
    }
    
    const vatAmount = (amount * rate) / 100;
    const totalAmount = amount + vatAmount;
    
    row.querySelector('.bulk-vat-amount').textContent = formatNumber(vatAmount);
    row.querySelector('.bulk-total-amount').textContent = formatNumber(totalAmount);
    resultDiv.classList.remove('hidden');
    
    // Update bulk calculation data
    VATCalculator.bulkCalculations[index] = {
        baseAmount: amount,
        vatRate: rate,
        vatAmount: vatAmount,
        totalAmount: totalAmount
    };
}

// Helper Functions
function loadSavedVATCalculations() {
    if (VATAX.isProUser) {
        const savedCalcs = JSON.parse(localStorage.getItem('vatax_saved_calculations') || '[]');
        VATCalculator.savedCalculations = savedCalcs.filter(calc => calc.calculationType);
        updateSavedCalculationsList();
    }
}

function updateSavedCalculationsList() {
    const recentCalculations = document.getElementById('recent-calculations');
    if (!recentCalculations || !VATAX.isProUser) return;
    
    if (VATCalculator.savedCalculations.length > 0) {
        recentCalculations.classList.remove('hidden');
        // Update table with saved calculations
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
                <div class="flex space-x-2">
                    <button onclick="viewCalculationDetails('${calc.id}')" class="text-green hover:text-green-dark" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="downloadCalculationPDF('${calc.id}')" class="text-orange hover:text-orange-dark" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="emailCalculation('${calc.id}')" class="text-navy hover:text-navy-dark" title="Email">
                        <i class="fas fa-envelope"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateVATFormState() {
    // Enable/disable pro features based on user subscription
    const proButtons = document.querySelectorAll('#pro-features button');
    
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

function showUpgradePrompt(feature) {
    showAlert(`Upgrade to VATAX Pro to ${feature} and unlock more advanced features!`, 'info');
    
    setTimeout(() => {
        if (confirm(`Would you like to upgrade to Pro to access ${feature}?`)) {
            window.location.href = 'pricing.html';
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

// Export functions to global scope
window.calculateVAT = calculateVAT;
window.clearCalculation = clearCalculation;
window.saveCalculation = saveCalculation;
window.exportToPDF = exportToPDF;
window.emailReport = emailReport;
window.addToComparison = addToComparison;
window.addBulkInput = addBulkInput;
window.removeBulkInput = removeBulkInput;
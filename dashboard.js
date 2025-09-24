// Dashboard JavaScript - Netlify compatible

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
    if (window.location.pathname.includes('dashboard.html') || 
        window.location.pathname === '/' && document.getElementById('dashboard-content')) {
        initializeDashboard();
    }
});

async function initializeDashboard() {
    if (!VATAX.currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    Dashboard.isLoading = true;
    showDashboardLoader();
    
    try {
        await loadDashboardStats();
        await loadRecentCalculations();
        await loadUpcomingDeadlines();
        
        initializeUsageChart();
        setupDashboardEventListeners();
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
    const quickActionButtons = document.querySelectorAll('.quick-action');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('data-href');
            if (href) {
                window.location.href = href;
            }
        });
    });
    
    setupActionButtons();
    setupUserDropdown();
    setupSubscriptionButtons();
}

// ... (বাকি কোডগুলো একইভাবে Netlify-compatible করে লিখতে হবে)

// Netlify-specific fix for chart initialization
function initializeUsageChart() {
    const canvas = document.getElementById('usage-chart');
    if (!canvas) return;
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Simple chart data
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'VAT Calculations',
            data: [12, 19, 15, 17, 14, 16],
            borderColor: '#FF9933',
            backgroundColor: 'rgba(255, 153, 51, 0.1)',
            tension: 0.4
        }]
    };
    
    Dashboard.charts.usage = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

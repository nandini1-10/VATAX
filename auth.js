// auth.js - Authentication System for VATAX

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.checkExistingSession();
        this.setupEventListeners();
    }

    // Check if user is already logged in
    checkExistingSession() {
        const userData = localStorage.getItem('vatax_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.isLoggedIn = true;
            this.updateUI();
        }
    }

    // Setup event listeners for auth forms
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Signup form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    // Handle user login
    async handleLogin(e) {
        if (e) e.preventDefault();
        
        const identifier = document.getElementById('login-identifier')?.value;
        const password = document.getElementById('login-password')?.value;

        if (!this.validateLoginInput(identifier, password)) {
            return;
        }

        try {
            await this.performLogin(identifier, password);
        } catch (error) {
            this.showAlert('Login failed. Please try again.', 'error');
        }
    }

    // Validate login inputs
    validateLoginInput(identifier, password) {
        if (!identifier || !password) {
            this.showAlert('Please fill in all fields', 'error');
            return false;
        }

        if (password.length < 6) {
            this.showAlert('Password must be at least 6 characters', 'error');
            return false;
        }

        return true;
    }

    // Perform login operation
    async performLogin(identifier, password) {
        // Show loading state
        const loginBtn = document.querySelector('#login-form button');
        if (loginBtn) {
            loginBtn.innerHTML = 'Logging in...';
            loginBtn.disabled = true;
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Create user session
        const userData = {
            id: 'user_' + Date.now(),
            name: this.extractNameFromIdentifier(identifier),
            email: this.isEmail(identifier) ? identifier : null,
            mobile: this.isMobile(identifier) ? identifier : null,
            subscription: 'free',
            joined: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem('vatax_user', JSON.stringify(userData));
        
        this.currentUser = userData;
        this.isLoggedIn = true;

        // Update UI
        this.updateUI();
        this.showAlert('Login successful!', 'success');
        
        // Close modal if exists
        this.closeModal('login-modal');

        // Reset button
        if (loginBtn) {
            loginBtn.innerHTML = 'Login';
            loginBtn.disabled = false;
        }
    }

    // Handle user signup
    async handleSignup(e) {
        if (e) e.preventDefault();
        
        const name = document.getElementById('signup-name')?.value;
        const identifier = document.getElementById('signup-identifier')?.value;
        const password = document.getElementById('signup-password')?.value;
        const terms = document.getElementById('terms-checkbox')?.checked;

        if (!this.validateSignupInput(name, identifier, password, terms)) {
            return;
        }

        try {
            await this.performSignup(name, identifier, password);
        } catch (error) {
            this.showAlert('Signup failed. Please try again.', 'error');
        }
    }

    // Validate signup inputs
    validateSignupInput(name, identifier, password, terms) {
        if (!name || !identifier || !password) {
            this.showAlert('Please fill in all fields', 'error');
            return false;
        }

        if (name.length < 2) {
            this.showAlert('Please enter your full name', 'error');
            return false;
        }

        if (!this.isValidIdentifier(identifier)) {
            this.showAlert('Please enter a valid email or mobile number', 'error');
            return false;
        }

        if (password.length < 6) {
            this.showAlert('Password must be at least 6 characters', 'error');
            return false;
        }

        if (!terms) {
            this.showAlert('Please accept the Terms of Service', 'error');
            return false;
        }

        return true;
    }

    // Perform signup operation
    async performSignup(name, identifier, password) {
        // Show loading state
        const signupBtn = document.querySelector('#signup-form button');
        if (signupBtn) {
            signupBtn.innerHTML = 'Creating Account...';
            signupBtn.disabled = true;
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create user data
        const userData = {
            id: 'user_' + Date.now(),
            name: name,
            email: this.isEmail(identifier) ? identifier : null,
            mobile: this.isMobile(identifier) ? identifier : null,
            subscription: 'free',
            joined: new Date().toISOString(),
            calculations: 0
        };

        // Save to localStorage
        localStorage.setItem('vatax_user', JSON.stringify(userData));
        
        this.currentUser = userData;
        this.isLoggedIn = true;

        // Update UI
        this.updateUI();
        this.showAlert('Account created successfully!', 'success');
        
        // Close modal
        this.closeModal('signup-modal');

        // Reset button
        if (signupBtn) {
            signupBtn.innerHTML = 'Create Account';
            signupBtn.disabled = false;
        }
    }

    // Handle user logout
    handleLogout() {
        localStorage.removeItem('vatax_user');
        this.currentUser = null;
        this.isLoggedIn = false;
        this.updateUI();
        this.showAlert('Logged out successfully', 'success');
    }

    // Update UI based on auth state
    updateUI() {
        const authSection = document.querySelector('.nav-auth');
        if (!authSection) return;

        if (this.isLoggedIn && this.currentUser) {
            authSection.innerHTML = `
                <div class="language-switcher">
                    <i class="fas fa-globe"></i>
                    <select id="language-select">
                        <option value="en">English</option>
                        <option value="bn">বাংলা</option>
                    </select>
                </div>
                <div class="user-menu">
                    <span>Welcome, ${this.currentUser.name}</span>
                    <button class="btn-logout" onclick="auth.handleLogout()">Logout</button>
                </div>
            `;
        } else {
            authSection.innerHTML = `
                <div class="language-switcher">
                    <i class="fas fa-globe"></i>
                    <select id="language-select">
                        <option value="en">English</option>
                        <option value="bn">বাংলা</option>
                    </select>
                </div>
                <button class="btn-login" onclick="showLogin()">Login</button>
                <button class="btn-signup" onclick="showSignup()">Sign Up</button>
            `;
        }
    }

    // Utility functions
    isEmail(identifier) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(identifier);
    }

    isMobile(identifier) {
        const mobileRegex = /^01[3-9]\d{8}$/;
        return mobileRegex.test(identifier);
    }

    isValidIdentifier(identifier) {
        return this.isEmail(identifier) || this.isMobile(identifier);
    }

    extractNameFromIdentifier(identifier) {
        if (this.isEmail(identifier)) {
            return identifier.split('@')[0];
        }
        return 'User';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.custom-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = 'custom-alert';
        alertDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 16px;
                background: ${this.getAlertColor(type)};
                color: white;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                font-size: 14px;
            ">
                ${message}
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    margin-left: 10px;
                    cursor: pointer;
                ">×</button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 3000);
    }

    getAlertColor(type) {
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        return colors[type] || '#3B82F6';
    }
}

// Initialize auth system
const auth = new AuthSystem();

// Global functions for modals
function showLogin() {
    document.getElementById('login-modal').style.display = 'block';
}

function showSignup() {
    document.getElementById('signup-modal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
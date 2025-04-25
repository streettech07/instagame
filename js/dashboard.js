document.addEventListener('DOMContentLoaded', async function() {
    // Set current year in footer
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Get login information
    let requestId = new URLSearchParams(window.location.search).get('requestId');
    let loginData = null;
    
    // If no requestId in URL, try from localStorage
    if (!requestId) {
        const storedLoginResult = localStorage.getItem('loginResult');
        if (storedLoginResult) {
            const loginResult = JSON.parse(storedLoginResult);
            requestId = loginResult.requestId;
        }
    }
    
    if (!requestId) {
        // No login information available, redirect to login page
        window.location.href = 'index.html';
        return;
    }
    
    try {
        // Get the login result from JSONbin
        const loginResult = await API.checkLoginResult(requestId);
        
        if (!loginResult || loginResult.status !== 'approved') {
            // Not approved, redirect to login page
            window.location.href = 'index.html';
            return;
        }
        
        // Get the full login details from pending logins or history
        const pendingData = await API.readBin(CONFIG.JSONBIN.BINS.PENDING_LOGINS);
        const historyData = await API.readBin(CONFIG.JSONBIN.BINS.LOGIN_HISTORY);
        
        const pendingLogins = pendingData.requests || [];
        const loginHistory = historyData.history || [];
        
        // Try to find the login request in either pending or history
        loginData = pendingLogins.find(req => req.id === requestId) || 
                   loginHistory.find(req => req.id === requestId);
        
        if (!loginData) {
            // Can't find detailed login data, redirect to login page
            window.location.href = 'index.html';
            return;
        }
        
        // Display login details
        displayLoginDetails(loginData);
        
    } catch (error) {
        console.error('Error loading login details:', error);
        showErrorMessage('Unable to load your login details. Please try logging in again.');
    }
    
    /**
     * Display login details in the dashboard
     */
    function displayLoginDetails(loginData) {
        // Display username
        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay) {
            usernameDisplay.textContent = loginData.username;
        }
        
        // Display password (masked by default)
        const passwordDisplay = document.getElementById('passwordDisplay');
        if (passwordDisplay && loginData.password) {
            passwordDisplay.textContent = '•'.repeat(loginData.password.length);
            passwordDisplay.setAttribute('data-password', loginData.password);
        }
        
        // Handle password toggle
        const togglePasswordBtn = document.getElementById('togglePassword');
        if (togglePasswordBtn && passwordDisplay) {
            togglePasswordBtn.addEventListener('click', function() {
                const icon = this.querySelector('i');
                const maskedPassword = '•'.repeat(loginData.password.length);
                
                if (passwordDisplay.textContent === maskedPassword) {
                    // Show password
                    passwordDisplay.textContent = loginData.password;
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    // Hide password
                    passwordDisplay.textContent = maskedPassword;
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }
        
        // Display login time
        const loginTime = document.getElementById('loginTime');
        if (loginTime) {
            loginTime.textContent = formatDate(new Date(loginData.timestamp));
        }
        
        // Update avatar
        const profileIcon = document.getElementById('profileIcon');
        if (profileIcon) {
            const firstLetter = loginData.username.charAt(0).toUpperCase();
            profileIcon.querySelector('.profile-fallback').textContent = firstLetter;
        }
    }
    
    /**
     * Show an error message on the dashboard
     */
    function showErrorMessage(message) {
        const mainElement = document.querySelector('main');
        if (mainElement) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-card';
            errorElement.innerHTML = `
                <h2>Error</h2>
                <p>${message}</p>
                <button id="backToLoginBtn" class="btn-primary">Back to Login</button>
            `;
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .error-card {
                    background-color: white;
                    border-radius: 8px;
                    padding: 24px;
                    margin: 20px auto;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    max-width: 400px;
                }
                
                .error-card h2 {
                    color: #ed4956;
                    margin-bottom: 16px;
                }
                
                .error-card p {
                    margin-bottom: 24px;
                    color: #8e8e8e;
                }
            `;
            document.head.appendChild(style);
            
            // Clear main content and add error
            mainElement.innerHTML = '';
            mainElement.appendChild(errorElement);
            
            // Add button functionality
            const backButton = document.getElementById('backToLoginBtn');
            if (backButton) {
                backButton.addEventListener('click', function() {
                    window.location.href = 'index.html';
                });
            }
        }
    }
    
    // Logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear login result
            localStorage.removeItem('loginResult');
            localStorage.removeItem('currentLoginRequestId');
            
            // Redirect to login page
            window.location.href = 'index.html';
        });
    }
    
    /**
     * Format date to readable string
     */
    function formatDate(date) {
        return date.toLocaleString();
    }
}); 
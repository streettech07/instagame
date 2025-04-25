document.addEventListener('DOMContentLoaded', async function() {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Initialize login requests using the API
    let loginRequests = [];
    
    // Load initial data
    try {
        loginRequests = await API.getLoginRequests();
        
        // Update stats
        updateStats(loginRequests);
        
        // Render login requests
        renderLoginRequests(loginRequests);
    } catch (error) {
        console.error('Error loading login requests:', error);
        showErrorMessage('Error loading login requests. Please refresh the page.');
    }
    
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
            filterLoginRequests(filter, loginRequests);
        });
    });
    
    // Poll for new login attempts at the configured interval
    setInterval(async () => {
        try {
            const updatedRequests = await API.getLoginRequests();
            
            // Check if there are new requests
            if (updatedRequests.length > loginRequests.length ||
                JSON.stringify(updatedRequests) !== JSON.stringify(loginRequests)) {
                
                loginRequests = updatedRequests;
                
                // Update UI
                updateStats(loginRequests);
                renderLoginRequests(loginRequests);
                
                // If there's a new pending login, show notification
                const newPendingRequests = updatedRequests.filter(
                    req => req.status === 'pending' && 
                    !loginRequests.some(oldReq => oldReq.id === req.id && oldReq.status === 'pending')
                );
                
                if (newPendingRequests.length > 0) {
                    notifyNewLogin(newPendingRequests[0]);
                }
            }
        } catch (error) {
            console.error('Error polling for new login requests:', error);
        }
    }, CONFIG.POLLING.CHECK_PENDING);
    
    /**
     * Update statistics display
     */
    function updateStats(requests) {
        const total = requests.length;
        const pending = requests.filter(req => req.status === 'pending').length;
        const approved = requests.filter(req => req.status === 'approved').length;
        const rejected = requests.filter(req => req.status === 'rejected').length;
        
        document.getElementById('totalRequests').textContent = total;
        document.getElementById('pendingRequests').textContent = pending;
        document.getElementById('approvedRequests').textContent = approved;
        document.getElementById('rejectedRequests').textContent = rejected;
    }
    
    /**
     * Render login requests in the UI
     */
    function renderLoginRequests(requests) {
        const container = document.getElementById('loginRequestsContainer');
        const emptyState = document.getElementById('emptyState');
        
        // Clear existing requests (except empty state)
        Array.from(container.children).forEach(child => {
            if (child !== emptyState) {
                container.removeChild(child);
            }
        });
        
        // Show or hide empty state
        if (requests.length === 0) {
            emptyState.style.display = 'block';
            return;
        } else {
            emptyState.style.display = 'none';
        }
        
        // Get current filter
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        
        // Filter requests based on active filter
        let filteredRequests = requests;
        if (activeFilter !== 'all') {
            filteredRequests = requests.filter(req => req.status === activeFilter);
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
        card.querySelector('.ip-address').textContent = request.ipAddress || '127.0.0.1';
        
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
        } else {
            approveBtn.addEventListener('click', function() {
                handleRequestAction(request.id, 'approved', 'Credentials verified successfully');
            });
            
            rejectBtn.addEventListener('click', function() {
                handleRequestAction(request.id, 'rejected', 'Password is incorrect');
            });
        }
        
        return card;
    }
    
    /**
     * Handle approve/reject action
     */
    async function handleRequestAction(requestId, action, reason) {
        try {
            // Find the request in our local array
            const request = loginRequests.find(req => req.id === requestId);
            if (!request) {
                console.error('Request not found:', requestId);
                return;
            }
            
            // Update the UI immediately for better user experience
            const card = document.querySelector(`.login-request-card[data-request-id="${requestId}"]`);
            if (card) {
                card.setAttribute('data-status', action);
                
                const statusBadge = card.querySelector('.status-badge');
                statusBadge.className = `status-badge ${action}`;
                statusBadge.textContent = capitalizeFirstLetter(action);
                
                const approveBtn = card.querySelector('.approve-btn');
                const rejectBtn = card.querySelector('.reject-btn');
                
                approveBtn.disabled = true;
                rejectBtn.disabled = true;
            }
            
            // Update the login status in the API
            await API.updateLoginStatus(requestId, action, reason);
            
            // Update our local data
            const index = loginRequests.findIndex(req => req.id === requestId);
            if (index !== -1) {
                loginRequests[index] = {
                    ...loginRequests[index],
                    status: action,
                    reason: reason
                };
            }
            
            // Update stats
            updateStats(loginRequests);
            
            // Show confirmation message
            showConfirmationMessage(
                `Login request ${action === 'approved' ? 'approved' : 'rejected'} successfully`,
                action
            );
            
        } catch (error) {
            console.error('Error handling request action:', error);
            showConfirmationMessage('Error processing action. Please try again.', 'error');
        }
    }
    
    /**
     * Show a confirmation message
     */
    function showConfirmationMessage(message, type) {
        // Create message element if it doesn't exist
        let messageElement = document.getElementById('confirmation-message');
        
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'confirmation-message';
            document.body.appendChild(messageElement);
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                #confirmation-message {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 4px;
                    font-weight: 500;
                    color: white;
                    background-color: #333;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                    z-index: 1000;
                    transition: transform 0.3s, opacity 0.3s;
                    transform: translateY(100px);
                    opacity: 0;
                }
                
                #confirmation-message.show {
                    transform: translateY(0);
                    opacity: 1;
                }
                
                #confirmation-message.approved {
                    background-color: #58c322;
                }
                
                #confirmation-message.rejected {
                    background-color: #ed4956;
                }
                
                #confirmation-message.error {
                    background-color: #e74c3c;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Set message and type
        messageElement.textContent = message;
        messageElement.className = type;
        
        // Show the message
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            messageElement.classList.remove('show');
        }, 3000);
    }
    
    /**
     * Show an error message in the admin panel
     */
    function showErrorMessage(message) {
        const container = document.getElementById('loginRequestsContainer');
        const emptyState = document.getElementById('emptyState');
        
        emptyState.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button id="retryButton" class="filter-btn">Retry</button>
        `;
        
        emptyState.style.display = 'block';
        
        // Add retry button functionality
        const retryButton = document.getElementById('retryButton');
        if (retryButton) {
            retryButton.addEventListener('click', async function() {
                try {
                    loginRequests = await API.getLoginRequests();
                    updateStats(loginRequests);
                    renderLoginRequests(loginRequests);
                } catch (error) {
                    console.error('Error retrying load:', error);
                    showErrorMessage('Still unable to load data. Please check your connection and try again.');
                }
            });
        }
    }
    
    /**
     * Filter login requests
     */
    function filterLoginRequests(filter, requests) {
        renderLoginRequests(requests);
    }
    
    /**
     * Format date to readable string
     */
    function formatDate(date) {
        return date.toLocaleString();
    }
    
    /**
     * Capitalize first letter of string
     */
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    /**
     * Notify admin of new login
     */
    function notifyNewLogin(request) {
        // Create notification if browser supports it
        if ('Notification' in window) {
            // Check if permission is already granted
            if (Notification.permission === 'granted') {
                createNotification(request);
            } 
            // Otherwise, ask for permission
            else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(function(permission) {
                    if (permission === 'granted') {
                        createNotification(request);
                    }
                });
            }
        }
        
        // Play notification sound
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3');
        audio.play().catch(e => console.log('Error playing notification sound:', e));
        
        function createNotification(request) {
            const notification = new Notification('New Login Request', {
                body: `User: ${request.username}\nTime: ${formatDate(new Date(request.timestamp))}`,
                icon: '/img/instagram-logo.png'
            });
            
            notification.onclick = function() {
                window.focus();
                // Scroll to and highlight the new request
                const card = document.querySelector(`.login-request-card[data-request-id="${request.id}"]`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth' });
                    card.classList.add('highlight');
                    
                    setTimeout(() => {
                        card.classList.remove('highlight');
                    }, 3000);
                }
            };
        }
    }
}); 
/**
 * API utility functions for working with JSONbin.io
 */

const API = {
    /**
     * Read data from a JSONbin
     * @param {string} binId - The JSONbin ID to read from
     * @returns {Promise<Object>} - The JSON data from the bin
     */
    async readBin(binId) {
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.JSONBIN.API_KEY
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.record || {};
        } catch (error) {
            console.error('Error reading from JSONbin:', error);
            return {};
        }
    },
    
    /**
     * Write data to a JSONbin
     * @param {string} binId - The JSONbin ID to write to
     * @param {Object} data - The data to write
     * @returns {Promise<Object>} - The response from JSONbin
     */
    async writeBin(binId, data) {
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.JSONBIN.API_KEY
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error writing to JSONbin:', error);
            throw error;
        }
    },
    
    /**
     * Generate a unique ID
     * @returns {string} - A unique ID
     */
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * Get client IP address (in a real app, this would be more sophisticated)
     * @returns {string} - The client IP address
     */
    getClientIp() {
        // In a real app, this would be determined server-side
        // For this demo, we'll return a placeholder
        return '123.45.67.89';
    },
    
    /**
     * Add a pending login request
     * @param {string} username - The username
     * @param {string} password - The password
     * @returns {Promise<Object>} - The created login request
     */
    async addPendingLogin(username, password) {
        try {
            // Read existing pending logins
            const data = await this.readBin(CONFIG.JSONBIN.BINS.PENDING_LOGINS);
            const pendingLogins = data.requests || [];
            
            // Create a new login request
            const requestId = this.generateId();
            const request = {
                id: requestId,
                username: username,
                password: password,
                timestamp: new Date().toISOString(),
                ipAddress: this.getClientIp(),
                deviceInfo: navigator.userAgent,
                status: 'pending'
            };
            
            // Add to pending logins
            pendingLogins.unshift(request);
            
            // Update JSONbin
            await this.writeBin(CONFIG.JSONBIN.BINS.PENDING_LOGINS, {
                requests: pendingLogins,
                lastUpdated: new Date().toISOString()
            });
            
            return request;
        } catch (error) {
            console.error('Error adding pending login:', error);
            throw error;
        }
    },
    
    /**
     * Check for login result
     * @param {string} requestId - The ID of the request to check
     * @returns {Promise<Object|null>} - The login result or null if not found
     */
    async checkLoginResult(requestId) {
        try {
            const data = await this.readBin(CONFIG.JSONBIN.BINS.LOGIN_RESULTS);
            const results = data.results || {};
            
            return results[requestId] || null;
        } catch (error) {
            console.error('Error checking login result:', error);
            return null;
        }
    },
    
    /**
     * Approve or reject a login request
     * @param {string} requestId - The ID of the request to update
     * @param {string} status - The new status ('approved' or 'rejected')
     * @param {string} reason - The reason for approval/rejection
     * @returns {Promise<void>}
     */
    async updateLoginStatus(requestId, status, reason) {
        try {
            // Update in pending logins
            const pendingData = await this.readBin(CONFIG.JSONBIN.BINS.PENDING_LOGINS);
            const pendingLogins = pendingData.requests || [];
            
            const updatedPendingLogins = pendingLogins.map(request => {
                if (request.id === requestId) {
                    return { ...request, status, reason };
                }
                return request;
            });
            
            await this.writeBin(CONFIG.JSONBIN.BINS.PENDING_LOGINS, {
                requests: updatedPendingLogins,
                lastUpdated: new Date().toISOString()
            });
            
            // Update login history
            const historyData = await this.readBin(CONFIG.JSONBIN.BINS.LOGIN_HISTORY);
            const loginHistory = historyData.history || [];
            
            const request = pendingLogins.find(req => req.id === requestId);
            if (request) {
                const updatedRequest = { ...request, status, reason };
                loginHistory.unshift(updatedRequest);
                
                await this.writeBin(CONFIG.JSONBIN.BINS.LOGIN_HISTORY, {
                    history: loginHistory,
                    lastUpdated: new Date().toISOString()
                });
            }
            
            // Add to login results for the user to check
            const resultsData = await this.readBin(CONFIG.JSONBIN.BINS.LOGIN_RESULTS);
            const results = resultsData.results || {};
            
            results[requestId] = {
                status,
                reason,
                timestamp: new Date().toISOString(),
                username: request ? request.username : null
            };
            
            await this.writeBin(CONFIG.JSONBIN.BINS.LOGIN_RESULTS, {
                results,
                lastUpdated: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Error updating login status:', error);
            throw error;
        }
    },
    
    /**
     * Get all login requests (for admin dashboard)
     * @returns {Promise<Array>} - Array of login requests
     */
    async getLoginRequests() {
        try {
            const pendingData = await this.readBin(CONFIG.JSONBIN.BINS.PENDING_LOGINS);
            const historyData = await this.readBin(CONFIG.JSONBIN.BINS.LOGIN_HISTORY);
            
            const pendingLogins = pendingData.requests || [];
            const loginHistory = historyData.history || [];
            
            // Combine and sort by timestamp (newest first)
            const allRequests = [...pendingLogins, ...loginHistory];
            
            // Remove duplicates (based on ID)
            const uniqueRequests = [];
            const ids = new Set();
            
            for (const request of allRequests) {
                if (!ids.has(request.id)) {
                    ids.add(request.id);
                    uniqueRequests.push(request);
                }
            }
            
            // Sort by timestamp (newest first)
            return uniqueRequests.sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
        } catch (error) {
            console.error('Error getting login requests:', error);
            return [];
        }
    }
}; 
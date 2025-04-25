// Configuration for cross-device communication
const CONFIG = {
    // JSONbin.io configuration
    JSONBIN: {
        // Your JSONbin.io API key - replace with your own key from jsonbin.io
        API_KEY: '$YOUR_JSONBIN_API_KEY', // Replace this with your actual API key
        
        // Bin IDs for storing data - create these bins on JSONbin.io and replace these IDs
        BINS: {
            PENDING_LOGINS: '$PENDING_LOGINS_BIN_ID', // For storing pending login requests
            LOGIN_RESULTS: '$LOGIN_RESULTS_BIN_ID',   // For storing approved/rejected results
            LOGIN_HISTORY: '$LOGIN_HISTORY_BIN_ID'    // For storing all login history
        }
    },
    
    // Polling intervals (in milliseconds)
    POLLING: {
        CHECK_APPROVAL: 5000,   // How often to check for login approval results
        CHECK_PENDING: 3000     // How often admin checks for new login requests
    }
}; 
// Configuration for cross-device communication
const CONFIG = {
    // JSONbin.io configuration
    JSONBIN: {
        // Your JSONbin.io API key - replace with your own key from jsonbin.io
        API_KEY:'$2a$10$8mfjdFdbG45oDDA78qRw9e1WV9tXw9SHVOEWjqmx5lPU05oT48Mz6', // Replace this with your actual API key
        
        // Bin IDs for storing data - create these bins on JSONbin.io and replace these IDs
        BINS: {
            PENDING_LOGINS: '680b701d8561e97a500741ad', // For storing pending login requests
            LOGIN_RESULTS: '680b704b8a456b7966911215',   // For storing approved/rejected results
            LOGIN_HISTORY: '680b70678561e97a500741c3'    // For storing all login history
        }
    },
    
    // Polling intervals (in milliseconds)
    POLLING: {
        CHECK_APPROVAL: 5000,   // How often to check for login approval results
        CHECK_PENDING: 3000     // How often admin checks for new login requests
    }
}; 
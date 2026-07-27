// Production Configuration
const CONFIG = {
    APP_NAME: 'Sales Tracker Pro',
    VERSION: '1.0.0',
    ENVIRONMENT: 'production',
    
    // Security settings
    SESSION_DURATION: 7, // days
    REQUIRE_EMAIL_VERIFICATION: true,
    
    // Features
    ENABLE_REGISTRATION: true,
    ENABLE_PASSWORD_RESET: true,
    ENABLE_EMAIL_NOTIFICATIONS: false,
    
    // Get current year for footer
    getCurrentYear() {
        return new Date().getFullYear();
    },
    
    // Check if running in production
    isProduction() {
        return window.location.hostname !== 'localhost' && 
               window.location.hostname !== '127.0.0.1';
    }
};

export default CONFIG;
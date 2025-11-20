// ============================================
// Supabase Configuration
// ============================================

// TODO: Replace these with your actual Supabase credentials
const SUPABASE_CONFIG = {
    url: 'YOUR_PROJECT_URL_HERE', // e.g., 'https://xxxxx.supabase.co'
    anonKey: 'YOUR_ANON_KEY_HERE'  // Your public anon key
};

// Initialize Supabase client
const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);

// ============================================
// Application State
// ============================================
const AppState = {
    currentUser: null,
    currentVendor: null,
    userType: null, // 'user' or 'vendor'
    selectedTill: null,

    setUser(user) {
        this.currentUser = user;
        this.userType = 'user';
        localStorage.setItem('userType', 'user');
    },

    setVendor(vendor) {
        this.currentVendor = vendor;
        this.userType = 'vendor';
        localStorage.setItem('userType', 'vendor');
    },

    clear() {
        this.currentUser = null;
        this.currentVendor = null;
        this.userType = null;
        this.selectedTill = null;
        localStorage.removeItem('userType');
    },

    isAuthenticated() {
        return this.currentUser !== null || this.currentVendor !== null;
    }
};

// ============================================
// Auth Helper Functions
// ============================================
async function getCurrentUser() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!session) return null;

        const userType = localStorage.getItem('userType');

        if (userType === 'vendor') {
            // Fetch vendor data
            const { data: vendor, error: vendorError } = await supabase
                .from('vendors')
                .select('*')
                .eq('auth_id', session.user.id)
                .single();

            if (vendorError) throw vendorError;
            AppState.setVendor(vendor);
            return { type: 'vendor', data: vendor };
        } else {
            // Fetch user data
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', session.user.id)
                .single();

            if (userError) throw userError;
            AppState.setUser(user);
            return { type: 'user', data: user };
        }
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        AppState.clear();
        navigateTo('home');
        showMessage('Signed out successfully', 'success');
    } catch (error) {
        console.error('Error signing out:', error);
        showMessage('Error signing out: ' + error.message, 'error');
    }
}

// ============================================
// Database Helper Functions
// ============================================

// Generate unique session code for QR payments
function generateSessionCode() {
    return 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Format currency
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }
}

// Format time
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// ============================================
// UI Helper Functions
// ============================================

// Show loading spinner
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">Loading...</div>
        `;
    }
}

// Show message alert
function showMessage(message, type = 'info') {
    const alertClass = type === 'error' ? 'alert-error' :
                      type === 'success' ? 'alert-success' : 'alert-info';

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translateX(-50%)';
    alertDiv.style.zIndex = '10000';
    alertDiv.style.maxWidth = '90%';
    alertDiv.style.width = '400px';

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.transition = 'opacity 0.3s';
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// ============================================
// Check if Supabase is configured
// ============================================
function isSupabaseConfigured() {
    return SUPABASE_CONFIG.url !== 'YOUR_PROJECT_URL_HERE' &&
           SUPABASE_CONFIG.anonKey !== 'YOUR_ANON_KEY_HERE';
}

// Show configuration warning if not set up
if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase not configured! Please update SUPABASE_CONFIG in js/config.js');
}

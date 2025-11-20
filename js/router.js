// ============================================
// Simple SPA Router
// ============================================

const Router = {
    currentPage: null,

    init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.showPage(e.state.page, false);
            }
        });

        // Load initial page
        const hash = window.location.hash.slice(1) || 'home';
        this.navigateTo(hash);
    },

    navigateTo(pageName, addToHistory = true) {
        this.showPage(pageName, addToHistory);
    },

    showPage(pageName, addToHistory = true) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));

        // Show requested page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;

            // Update URL and history
            if (addToHistory) {
                window.history.pushState({ page: pageName }, '', `#${pageName}`);
            }

            // Call page initialization if it exists
            const initFunctionName = this.getInitFunctionName(pageName);
            console.log(`🔍 Looking for init function: ${initFunctionName}`);
            if (window[initFunctionName]) {
                console.log(`✅ Calling ${initFunctionName}()`);
                window[initFunctionName]();
            } else {
                console.log(`⚠️ No init function found for page: ${pageName}`);
            }
        } else {
            console.error(`Page not found: ${pageName}`);
        }
    },

    getInitFunctionName(pageName) {
        // Convert kebab-case to camelCase for function names
        // e.g., "merchant-dashboard" -> "initMerchantDashboardPage"
        // e.g., "user-login" -> "initUserLoginPage"
        const camelCase = pageName
            .split('-')
            .map((word, index) => {
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join('');
        return `init${camelCase}Page`;
    },

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};

// Expose globally
window.navigateTo = (page) => Router.navigateTo(page);

// Initialize router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Router.init();
});

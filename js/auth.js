// ============================================
// User Registration
// ============================================
async function handleUserRegister(event) {
    event.preventDefault();

    const name = document.getElementById('user-register-name').value;
    const email = document.getElementById('user-register-email').value;
    const password = document.getElementById('user-register-password').value;

    if (!isSupabaseConfigured()) {
        showMessage('Please configure Supabase in js/config.js first', 'error');
        return;
    }

    try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) throw authError;

        if (!authData.user) {
            throw new Error('User creation failed');
        }

        // Create user profile
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([{
                auth_id: authData.user.id,
                name: name,
                email: email,
                balance: 100.00 // Starting balance for demo
            }])
            .select()
            .single();

        if (userError) throw userError;

        AppState.setUser(userData);
        showMessage('Account created successfully!', 'success');
        navigateTo('user-dashboard');

    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Registration failed: ' + error.message, 'error');
    }
}

// ============================================
// User Login
// ============================================
async function handleUserLogin(event) {
    event.preventDefault();

    const email = document.getElementById('user-login-email').value;
    const password = document.getElementById('user-login-password').value;

    if (!isSupabaseConfigured()) {
        showMessage('Please configure Supabase in js/config.js first', 'error');
        return;
    }

    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // Fetch user profile
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authData.user.id)
            .single();

        if (userError) throw userError;

        AppState.setUser(userData);
        showMessage('Welcome back, ' + userData.name + '!', 'success');
        navigateTo('user-dashboard');

    } catch (error) {
        console.error('Login error:', error);
        showMessage('Login failed: ' + error.message, 'error');
    }
}

// ============================================
// Merchant Registration
// ============================================
async function handleMerchantRegister(event) {
    event.preventDefault();

    const name = document.getElementById('merchant-register-name').value;
    const email = document.getElementById('merchant-register-email').value;
    const password = document.getElementById('merchant-register-password').value;
    const businessName = document.getElementById('merchant-register-business').value;

    if (!isSupabaseConfigured()) {
        showMessage('Please configure Supabase in js/config.js first', 'error');
        return;
    }

    try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) throw authError;

        if (!authData.user) {
            throw new Error('User creation failed');
        }

        // Create vendor profile
        const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .insert([{
                auth_id: authData.user.id,
                name: businessName,
                description: ''
            }])
            .select()
            .single();

        if (vendorError) throw vendorError;

        // Create a default till
        const { error: tillError } = await supabase
            .from('tills')
            .insert([{
                vendor_id: vendorData.id,
                till_name: 'Main Register'
            }]);

        if (tillError) throw tillError;

        AppState.setVendor(vendorData);
        showMessage('Merchant account created successfully!', 'success');
        navigateTo('merchant-dashboard');

    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Registration failed: ' + error.message, 'error');
    }
}

// ============================================
// Merchant Login
// ============================================
async function handleMerchantLogin(event) {
    event.preventDefault();

    const email = document.getElementById('merchant-login-email').value;
    const password = document.getElementById('merchant-login-password').value;

    if (!isSupabaseConfigured()) {
        showMessage('Please configure Supabase in js/config.js first', 'error');
        return;
    }

    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // Fetch vendor profile
        const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('*')
            .eq('auth_id', authData.user.id)
            .single();

        if (vendorError) throw vendorError;

        AppState.setVendor(vendorData);
        showMessage('Welcome back, ' + vendorData.name + '!', 'success');
        navigateTo('merchant-dashboard');

    } catch (error) {
        console.error('Login error:', error);
        showMessage('Login failed: ' + error.message, 'error');
    }
}

// ============================================
// Initialize Home Page
// ============================================
function initHomePage() {
    // Check if user is already logged in
    getCurrentUser().then(result => {
        if (result) {
            if (result.type === 'user') {
                navigateTo('user-dashboard');
            } else if (result.type === 'vendor') {
                navigateTo('merchant-dashboard');
            }
        }
    });
}

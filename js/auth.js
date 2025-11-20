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
            .maybeSingle();

        if (userError) {
            console.error('User fetch error details:', userError);
            throw userError;
        }

        // Check if user profile exists - if not, create it
        if (!userData) {
            console.warn('User profile not found, creating one...');

            // Extract name from email if available
            const userName = authData.user.user_metadata?.name ||
                           authData.user.email.split('@')[0];

            // Create missing profile
            const { data: newUserData, error: createError } = await supabase
                .from('users')
                .insert([{
                    auth_id: authData.user.id,
                    name: userName,
                    email: authData.user.email,
                    balance: 100.00
                }])
                .select()
                .single();

            if (createError) {
                console.error('Failed to create user profile:', createError);
                throw new Error('Account exists but profile could not be created. Please contact support.');
            }

            AppState.setUser(newUserData);
            showMessage('Welcome! Profile created successfully.', 'success');
            navigateTo('user-dashboard');
            return;
        }

        const user = userData;

        AppState.setUser(user);
        showMessage('Welcome back, ' + user.name + '!', 'success');
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
            .maybeSingle();

        if (vendorError) {
            console.error('Vendor fetch error details:', vendorError);
            throw vendorError;
        }

        // Check if vendor profile exists - if not, create it
        if (!vendorData) {
            console.warn('Merchant profile not found, creating one...');

            // Extract name from email
            const businessName = authData.user.user_metadata?.business_name ||
                                authData.user.email.split('@')[0] + ' Business';

            // Create missing profile
            const { data: newVendorData, error: createError } = await supabase
                .from('vendors')
                .insert([{
                    auth_id: authData.user.id,
                    name: businessName,
                    email: authData.user.email
                }])
                .select()
                .single();

            if (createError) {
                console.error('Failed to create vendor profile:', createError);
                throw new Error('Account exists but profile could not be created. Please contact support.');
            }

            // Create default till
            await supabase
                .from('tills')
                .insert([{
                    vendor_id: newVendorData.id,
                    till_name: 'Main Register'
                }]);

            AppState.setVendor(newVendorData);
            showMessage('Welcome! Merchant profile created successfully.', 'success');
            navigateTo('merchant-dashboard');
            return;
        }

        const vendor = vendorData;

        AppState.setVendor(vendor);
        showMessage('Welcome back, ' + vendor.name + '!', 'success');
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

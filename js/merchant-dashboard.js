// ============================================
// Merchant Dashboard
// ============================================

async function initMerchantDashboardPage() {
    if (!AppState.currentVendor) {
        const result = await getCurrentUser();
        if (!result || result.type !== 'vendor') {
            navigateTo('home');
            return;
        }
    }

    // Update dashboard header
    document.getElementById('vendor-name-display').textContent = AppState.currentVendor.name;

    // Load tills
    await loadMerchantTills();

    // Load recent transactions
    await loadMerchantTransactions();
}

async function loadMerchantTills() {
    const container = document.getElementById('merchant-tills-grid');
    showLoading('merchant-tills-grid');

    try {
        console.log('Loading tills for vendor:', AppState.currentVendor.id);

        const { data: tills, error } = await supabase
            .from('tills')
            .select('*')
            .eq('vendor_id', AppState.currentVendor.id)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        console.log('Tills query result:', { tills, error });

        if (error) throw error;

        if (!tills || tills.length === 0) {
            console.warn('No tills found for vendor:', AppState.currentVendor.id);
            container.innerHTML = `
                <div class="card">
                    <p class="text-center text-muted">No active tills found. Go to "Manage Tills" to add one!</p>
                    <button class="btn btn-primary" style="margin-top: 10px;" onclick="goToTillManagement()">Manage Tills</button>
                </div>
            `;
            return;
        }

        console.log(`Found ${tills.length} tills`);

        let html = '';
        tills.forEach(till => {
            html += `
                <div class="till-card" onclick="selectMerchantTill('${till.id}', '${till.till_name}')">
                    <div class="till-name">${till.till_name}</div>
                    <div class="till-count">Click to select</div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading tills:', error);
        container.innerHTML = `
            <div class="card">
                <p class="text-center text-muted">Error loading tills: ${error.message}</p>
                <p class="text-center" style="font-size: 12px; margin-top: 10px;">Check browser console for details</p>
            </div>
        `;
    }
}

function selectMerchantTill(tillId, tillName) {
    AppState.selectedTill = { id: tillId, name: tillName };
    navigateTo('merchant-payment');
}

// Make function globally accessible
window.selectMerchantTill = selectMerchantTill;

async function loadMerchantTransactions() {
    const container = document.getElementById('merchant-transactions-list');
    showLoading('merchant-transactions-list');

    try {
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select(`
                *,
                tills (till_name)
            `)
            .eq('vendor_id', AppState.currentVendor.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!transactions || transactions.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No transactions yet</p>';
            return;
        }

        // Group transactions by day
        const grouped = groupTransactionsByDay(transactions);

        let html = '';
        for (const [day, dayTransactions] of Object.entries(grouped)) {
            html += `<div class="day-header">${day}</div>`;
            html += '<ul class="transaction-list">';

            dayTransactions.forEach(tx => {
                const tillName = tx.tills?.till_name || 'Unknown Till';
                const time = formatTime(tx.created_at);
                const payerName = tx.payer_name || 'Unknown';

                html += `
                    <li class="transaction-item">
                        <div class="transaction-info">
                            <div class="transaction-name">${payerName} - ${tillName}</div>
                            <div class="transaction-date">${time}</div>
                        </div>
                        <div class="transaction-amount positive">+${formatCurrency(tx.amount)}</div>
                    </li>
                `;
            });

            html += '</ul>';
        }

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading transactions:', error);
        container.innerHTML = '<p class="text-center text-muted">Error loading transactions</p>';
    }
}

function groupTransactionsByDay(transactions) {
    const grouped = {};

    transactions.forEach(tx => {
        const day = formatDate(tx.created_at);
        if (!grouped[day]) {
            grouped[day] = [];
        }
        grouped[day].push(tx);
    });

    return grouped;
}

// ============================================
// Merchant Profile Management
// ============================================
function goToMerchantProfile() {
    navigateTo('merchant-profile');
}

async function initMerchantProfilePage() {
    if (!AppState.currentVendor) {
        navigateTo('home');
        return;
    }

    // Populate form with current data
    document.getElementById('profile-business-name').value = AppState.currentVendor.name || '';
    document.getElementById('profile-description').value = AppState.currentVendor.description || '';

    if (AppState.currentVendor.logo_url) {
        document.getElementById('profile-logo-preview').innerHTML =
            `<img src="${AppState.currentVendor.logo_url}" alt="Logo">`;
    }
}

async function saveMerchantProfile(event) {
    event.preventDefault();

    const name = document.getElementById('profile-business-name').value;
    const description = document.getElementById('profile-description').value;

    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const { data, error } = await supabase
            .from('vendors')
            .update({
                name: name,
                description: description
            })
            .eq('id', AppState.currentVendor.id)
            .select()
            .single();

        if (error) throw error;

        AppState.currentVendor = data;
        showMessage('Profile updated successfully!', 'success');

    } catch (error) {
        console.error('Error saving profile:', error);
        showMessage('Error saving profile: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    }
}

// ============================================
// Till Management
// ============================================
function goToTillManagement() {
    navigateTo('merchant-tills');
}

async function initMerchantTillsPage() {
    if (!AppState.currentVendor) {
        navigateTo('home');
        return;
    }

    await loadAllTills();
}

async function loadAllTills() {
    const container = document.getElementById('tills-management-list');
    showLoading('tills-management-list');

    try {
        const { data: tills, error } = await supabase
            .from('tills')
            .select('*')
            .eq('vendor_id', AppState.currentVendor.id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!tills || tills.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No tills yet. Add one below!</p>';
            return;
        }

        let html = '<ul class="transaction-list">';
        tills.forEach(till => {
            const status = till.is_active ? 'Active' : 'Inactive';
            const statusClass = till.is_active ? 'text-success' : 'text-muted';

            html += `
                <li class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-name">${till.till_name}</div>
                        <div class="transaction-date ${statusClass}">${status}</div>
                    </div>
                    <button class="btn btn-outline" style="width: auto; padding: 8px 16px;"
                            onclick="toggleTill('${till.id}', ${!till.is_active})">
                        ${till.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </li>
            `;
        });
        html += '</ul>';

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading tills:', error);
        container.innerHTML = '<p class="text-center text-muted">Error loading tills</p>';
    }
}

async function addNewTill(event) {
    event.preventDefault();

    const tillName = document.getElementById('new-till-name').value;

    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Adding...';

    try {
        const { error } = await supabase
            .from('tills')
            .insert([{
                vendor_id: AppState.currentVendor.id,
                till_name: tillName,
                is_active: true
            }]);

        if (error) throw error;

        showMessage('Till added successfully!', 'success');
        document.getElementById('new-till-name').value = '';
        await loadAllTills();

    } catch (error) {
        console.error('Error adding till:', error);
        showMessage('Error adding till: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Add Till';
    }
}

async function toggleTill(tillId, newStatus) {
    try {
        const { error } = await supabase
            .from('tills')
            .update({ is_active: newStatus })
            .eq('id', tillId);

        if (error) throw error;

        showMessage(newStatus ? 'Till activated' : 'Till deactivated', 'success');
        await loadAllTills();

    } catch (error) {
        console.error('Error toggling till:', error);
        showMessage('Error updating till: ' + error.message, 'error');
    }
}

// Make functions globally accessible
window.toggleTill = toggleTill;

// ============================================
// Payment Entry & QR Generation
// ============================================

let currentPaymentSessionId = null;
let paymentSubscription = null;
let autoRedirectTimeout = null;

async function initMerchantPaymentPage() {
    if (!AppState.currentVendor || !AppState.selectedTill) {
        navigateTo('merchant-dashboard');
        return;
    }

    document.getElementById('selected-till-name').textContent = AppState.selectedTill.name;

    // Clear previous session
    if (paymentSubscription) {
        paymentSubscription.unsubscribe();
    }
    currentPaymentSessionId = null;
}

async function generateMerchantQR(event) {
    event.preventDefault();

    const amount = parseFloat(document.getElementById('payment-amount-input').value);

    if (isNaN(amount) || amount <= 0) {
        showMessage('Please enter a valid amount', 'error');
        return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
        // Create payment session
        const sessionCode = generateSessionCode();

        const { data: session, error } = await supabase
            .from('payment_sessions')
            .insert([{
                session_code: sessionCode,
                vendor_id: AppState.currentVendor.id,
                till_id: AppState.selectedTill.id,
                amount: amount,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;

        currentPaymentSessionId = session.id;

        // Generate QR code
        const qrContainer = document.getElementById('merchant-qr-display');
        qrContainer.innerHTML = '';

        new QRCode(qrContainer, {
            text: sessionCode,
            width: 300,
            height: 300,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        document.getElementById('merchant-qr-amount').textContent = formatCurrency(amount);
        document.getElementById('merchant-qr-section').style.display = 'block';
        document.getElementById('merchant-payment-form').style.display = 'none';

        // Subscribe to payment status changes
        subscribeToPaymentStatus(session.id, amount);

    } catch (error) {
        console.error('Error generating QR:', error);
        showMessage('Error generating QR code: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Generate QR Code';
    }
}

function subscribeToPaymentStatus(sessionId, amount) {
    // Subscribe to payment session updates
    paymentSubscription = supabase
        .channel(`payment-session-${sessionId}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'payment_sessions',
            filter: `id=eq.${sessionId}`
        }, (payload) => {
            if (payload.new.status === 'completed') {
                onPaymentCompleted(amount);
            }
        })
        .subscribe();

    // Also poll for transaction completion
    const pollInterval = setInterval(async () => {
        const { data } = await supabase
            .from('payment_sessions')
            .select('status')
            .eq('id', sessionId)
            .single();

        if (data && data.status === 'completed') {
            clearInterval(pollInterval);
            onPaymentCompleted(amount);
        }
    }, 2000);

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000);
}

async function onPaymentCompleted(amount) {
    if (paymentSubscription) {
        paymentSubscription.unsubscribe();
    }

    // Get the user who paid
    const { data: transaction } = await supabase
        .from('transactions')
        .select('payer_name')
        .eq('peer_session_id', (await supabase
            .from('payment_sessions')
            .select('session_code')
            .eq('id', currentPaymentSessionId)
            .single()).data.session_code)
        .single();

    const payerName = transaction?.payer_name || 'Customer';

    // Show confirmation
    document.getElementById('merchant-confirm-payer').textContent = payerName;
    document.getElementById('merchant-confirm-amount').textContent = formatCurrency(amount);

    navigateTo('merchant-confirm');

    // Auto-redirect after 3 seconds to create new transaction
    autoRedirectTimeout = setTimeout(() => {
        continueNewTransaction();
    }, 3000);
}

// Function to continue to new transaction
function continueNewTransaction() {
    // Clear auto-redirect timer if it exists
    if (autoRedirectTimeout) {
        clearTimeout(autoRedirectTimeout);
        autoRedirectTimeout = null;
    }

    resetMerchantPayment();
    navigateTo('merchant-payment'); // Go back to payment entry with same till
}

// Make function globally accessible
window.continueNewTransaction = continueNewTransaction;

function cancelMerchantQR() {
    if (paymentSubscription) {
        paymentSubscription.unsubscribe();
    }

    // Mark session as expired
    if (currentPaymentSessionId) {
        supabase
            .from('payment_sessions')
            .update({ status: 'expired' })
            .eq('id', currentPaymentSessionId);
    }

    resetMerchantPayment();
}

function resetMerchantPayment() {
    document.getElementById('merchant-qr-section').style.display = 'none';
    document.getElementById('merchant-payment-form').style.display = 'block';
    document.getElementById('payment-amount-input').value = '';
    currentPaymentSessionId = null;
}

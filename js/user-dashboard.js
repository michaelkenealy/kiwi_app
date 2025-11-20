// ============================================
// User Dashboard
// ============================================

async function initUserDashboardPage() {
    if (!AppState.currentUser) {
        const result = await getCurrentUser();
        if (!result || result.type !== 'user') {
            navigateTo('home');
            return;
        }
    }

    // Update dashboard header
    document.getElementById('user-name-display').textContent = AppState.currentUser.name;
    document.getElementById('user-balance').textContent = formatCurrency(AppState.currentUser.balance);

    // Load transactions
    await loadUserTransactions();
}

async function loadUserTransactions() {
    const container = document.getElementById('user-transactions-list');
    showLoading('user-transactions-list');

    try {
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select(`
                *,
                vendors (name),
                tills (till_name)
            `)
            .eq('user_id', AppState.currentUser.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!transactions || transactions.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No transactions yet</p>';
            return;
        }

        // Get recipient names for P2P transactions
        const recipientIds = transactions
            .filter(tx => tx.recipient_user_id)
            .map(tx => tx.recipient_user_id);

        let recipientMap = {};
        if (recipientIds.length > 0) {
            const { data: recipients } = await supabase
                .from('users')
                .select('id, name')
                .in('id', recipientIds);

            if (recipients) {
                recipients.forEach(u => {
                    recipientMap[u.id] = u.name;
                });
            }
        }

        // Group transactions by day
        const grouped = groupTransactionsByDay(transactions);

        let html = '';
        for (const [day, dayTransactions] of Object.entries(grouped)) {
            html += `<div class="day-header">${day}</div>`;
            html += '<ul class="transaction-list">';

            dayTransactions.forEach(tx => {
                const type = tx.transaction_type || 'payment';
                const time = formatTime(tx.created_at);

                let icon = '💳';
                let description = '';
                let amountClass = 'negative';
                let amountPrefix = '-';

                if (type === 'send') {
                    icon = '↗';
                    const recipientName = recipientMap[tx.recipient_user_id] || 'User';
                    description = `Sent to ${recipientName}`;
                    amountClass = 'negative';
                    amountPrefix = '-';
                } else if (type === 'receive') {
                    icon = '↙';
                    const senderName = recipientMap[tx.recipient_user_id] || 'User';
                    description = `Received from ${senderName}`;
                    amountClass = 'positive';
                    amountPrefix = '+';
                } else {
                    // payment type
                    const vendorName = tx.vendors?.name || 'Unknown Vendor';
                    const tillName = tx.tills?.till_name || '';
                    description = `${vendorName}${tillName ? ` (${tillName})` : ''}`;
                    amountClass = 'negative';
                    amountPrefix = '-';
                }

                html += `
                    <li class="transaction-item">
                        <div class="transaction-info">
                            <div class="transaction-name">${icon} ${description}</div>
                            <div class="transaction-date">${time}</div>
                        </div>
                        <div class="transaction-amount ${amountClass}">${amountPrefix}${formatCurrency(tx.amount)}</div>
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
// Start Payment Flow (Scan QR)
// ============================================
function startUserPayment() {
    navigateTo('user-scan');
}

// ============================================
// User Scan Page
// ============================================
let html5QrCode = null;
let isScanning = false;

function initUserScanPage() {
    if (!AppState.currentUser) {
        navigateTo('home');
        return;
    }

    // Initialize QR scanner
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("user-qr-reader");
    }
}

async function startUserScanner() {
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    try {
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onUserScanSuccess,
            onUserScanFailure
        );

        isScanning = true;
        document.getElementById('user-scan-btn').style.display = 'none';
        document.getElementById('user-stop-btn').style.display = 'block';
        document.getElementById('user-scan-result').textContent = 'Scanning for QR code...';

    } catch (error) {
        console.error('Scanner start error:', error);
        showMessage('Could not start camera: ' + error.message, 'error');
    }
}

async function stopUserScanner() {
    if (isScanning && html5QrCode) {
        try {
            await html5QrCode.stop();
            isScanning = false;
            document.getElementById('user-scan-btn').style.display = 'block';
            document.getElementById('user-stop-btn').style.display = 'none';
            document.getElementById('user-scan-result').textContent = 'Camera stopped';
        } catch (error) {
            console.error('Scanner stop error:', error);
        }
    }
}

async function onUserScanSuccess(decodedText, decodedResult) {
    stopUserScanner();

    document.getElementById('user-scan-result').textContent = 'QR Code detected! Processing...';

    try {
        // Try to parse as JSON (could be user QR or payment session)
        let qrData;
        try {
            qrData = JSON.parse(decodedText);
        } catch {
            // Not JSON, treat as session code
            qrData = { type: 'payment', code: decodedText };
        }

        // Handle user QR code (for P2P transfers)
        if (qrData.type === 'user') {
            showMessage('User QR detected! Redirecting to send money...', 'success');

            // Pre-fill recipient in send money page
            AppState.scannerResult = {
                type: 'user',
                userId: qrData.userId,
                userName: qrData.userName
            };

            navigateTo('user-send-money');
            return;
        }

        // Handle payment session QR code (merchant payment)
        const sessionCode = qrData.code || decodedText;

        document.getElementById('user-scan-result').textContent = 'Loading payment details...';

        // Fetch payment session details
        const { data: session, error } = await supabase
            .from('payment_sessions')
            .select(`
                *,
                vendors (name, description),
                tills (till_name)
            `)
            .eq('session_code', sessionCode)
            .eq('status', 'pending')
            .single();

        if (error || !session) {
            showMessage('Invalid or expired QR code', 'error');
            return;
        }

        // Check if session is expired
        if (new Date(session.expires_at) < new Date()) {
            showMessage('This payment request has expired', 'error');
            return;
        }

        // Update session status to scanned
        await supabase
            .from('payment_sessions')
            .update({ status: 'scanned' })
            .eq('id', session.id);

        // Show payment confirmation
        showPaymentConfirmation(session);

    } catch (error) {
        console.error('Error processing QR code:', error);
        showMessage('Error processing payment: ' + error.message, 'error');
    }
}

function onUserScanFailure(error) {
    // Ignore scan failures (too noisy)
}

// ============================================
// Payment Confirmation
// ============================================
let currentPaymentSession = null;

function showPaymentConfirmation(session) {
    currentPaymentSession = session;

    const vendorName = session.vendors?.name || 'Unknown Vendor';
    const tillName = session.tills?.till_name || '';
    const amount = formatCurrency(session.amount);

    document.getElementById('payment-vendor-name').textContent = vendorName;
    document.getElementById('payment-till-name').textContent = tillName ? `Till: ${tillName}` : '';
    document.getElementById('payment-amount-display').textContent = amount;
    document.getElementById('user-current-balance').textContent = formatCurrency(AppState.currentUser.balance);

    const newBalance = parseFloat(AppState.currentUser.balance) - parseFloat(session.amount);
    document.getElementById('user-new-balance').textContent = formatCurrency(newBalance);

    if (newBalance < 0) {
        document.getElementById('confirm-payment-btn').disabled = true;
        showMessage('Insufficient balance', 'error');
    } else {
        document.getElementById('confirm-payment-btn').disabled = false;
    }

    navigateTo('user-confirm');
}

async function confirmUserPayment() {
    if (!currentPaymentSession) return;

    const btn = document.getElementById('confirm-payment-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
        // Calculate new balance
        const newBalance = parseFloat(AppState.currentUser.balance) - parseFloat(currentPaymentSession.amount);

        // Create transaction
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert([{
                vendor_id: currentPaymentSession.vendor_id,
                till_id: currentPaymentSession.till_id,
                user_id: AppState.currentUser.id,
                amount: currentPaymentSession.amount,
                payer_name: AppState.currentUser.name,
                peer_session_id: currentPaymentSession.session_code,
                unique_code: generateSessionCode(),
                status: 'completed'
            }])
            .select()
            .single();

        if (txError) throw txError;

        // Update user balance
        const { error: balanceError } = await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('id', AppState.currentUser.id);

        if (balanceError) throw balanceError;

        // Update session status
        await supabase
            .from('payment_sessions')
            .update({ status: 'completed' })
            .eq('id', currentPaymentSession.id);

        // Update local state
        AppState.currentUser.balance = newBalance;

        // Show success
        showPaymentSuccess(transaction);

    } catch (error) {
        console.error('Payment error:', error);
        showMessage('Payment failed: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Pay Now';
    }
}

function showPaymentSuccess(transaction) {
    document.getElementById('success-amount').textContent = formatCurrency(transaction.amount);
    navigateTo('user-success');

    // Auto-redirect to dashboard after 3 seconds
    setTimeout(() => {
        navigateTo('user-dashboard');
    }, 3000);
}

function cancelUserPayment() {
    currentPaymentSession = null;
    navigateTo('user-scan');
}

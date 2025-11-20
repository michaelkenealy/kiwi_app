// ============================================
// P2P Transfer Functions
// Send and receive money between users
// ============================================

// ============================================
// User Settings Management
// ============================================

async function getUserSettings(userId) {
    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;

        // If no settings exist, create defaults
        if (!data) {
            const { data: newSettings, error: insertError } = await supabase
                .from('user_settings')
                .insert([{
                    user_id: userId,
                    transaction_limit: 500.00,
                    daily_limit: 1000.00
                }])
                .select()
                .single();

            if (insertError) throw insertError;
            return newSettings;
        }

        return data;
    } catch (error) {
        console.error('Error getting user settings:', error);
        // Return defaults on error
        return {
            transaction_limit: 500.00,
            daily_limit: 1000.00
        };
    }
}

async function updateUserSettings(userId, transactionLimit, dailyLimit) {
    try {
        const { data, error } = await supabase
            .from('user_settings')
            .update({
                transaction_limit: transactionLimit,
                daily_limit: dailyLimit
            })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error updating user settings:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// Daily Limit Checking
// ============================================

async function getTodaySentTotal(userId) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('transaction_type', 'send')
            .gte('created_at', today.toISOString());

        if (error) throw error;

        const total = data.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        return total;
    } catch (error) {
        console.error('Error getting today sent total:', error);
        return 0;
    }
}

// ============================================
// Find Recipient
// ============================================

async function findUserByEmail(email) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error finding user:', error);
        return null;
    }
}

async function findUserById(userId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', userId)
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error finding user:', error);
        return null;
    }
}

// ============================================
// Send Money Transaction
// ============================================

async function sendMoneyToUser(senderUserId, recipientUserId, amount) {
    try {
        // 1. Get sender info
        const sender = await findUserById(senderUserId);
        if (!sender) {
            return { success: false, error: 'Sender not found' };
        }

        // 2. Get recipient info
        const recipient = await findUserById(recipientUserId);
        if (!recipient) {
            return { success: false, error: 'Recipient not found' };
        }

        // 3. Check if sending to self
        if (senderUserId === recipientUserId) {
            return { success: false, error: 'Cannot send money to yourself' };
        }

        // 4. Get sender settings
        const settings = await getUserSettings(senderUserId);

        // 5. Check transaction limit
        if (amount > settings.transaction_limit) {
            return {
                success: false,
                error: `Transaction limit exceeded. Maximum: $${settings.transaction_limit}`
            };
        }

        // 6. Check daily limit
        const todayTotal = await getTodaySentTotal(senderUserId);
        if (todayTotal + amount > settings.daily_limit) {
            const remaining = settings.daily_limit - todayTotal;
            return {
                success: false,
                error: `Daily limit exceeded. Remaining today: $${remaining.toFixed(2)}`
            };
        }

        // 7. Check sender balance
        const { data: senderData, error: balanceError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', senderUserId)
            .single();

        if (balanceError) throw balanceError;

        if (senderData.balance < amount) {
            return {
                success: false,
                error: 'Insufficient balance'
            };
        }

        // 8. Deduct from sender
        const { error: deductError } = await supabase
            .from('users')
            .update({ balance: senderData.balance - amount })
            .eq('id', senderUserId);

        if (deductError) throw deductError;

        // 9. Add to recipient
        const { data: recipientData, error: recipientBalanceError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', recipientUserId)
            .single();

        if (recipientBalanceError) throw recipientBalanceError;

        const { error: addError } = await supabase
            .from('users')
            .update({ balance: recipientData.balance + amount })
            .eq('id', recipientUserId);

        if (addError) throw addError;

        // 10. Create transaction record for sender (debit)
        const { error: senderTxError } = await supabase
            .from('transactions')
            .insert([{
                user_id: senderUserId,
                recipient_user_id: recipientUserId,
                amount: amount,
                transaction_type: 'send',
                payer_name: sender.name,
                status: 'completed'
            }]);

        if (senderTxError) throw senderTxError;

        // 11. Create transaction record for recipient (credit)
        const { error: recipientTxError } = await supabase
            .from('transactions')
            .insert([{
                user_id: recipientUserId,
                recipient_user_id: senderUserId,
                amount: amount,
                transaction_type: 'receive',
                payer_name: recipient.name,
                status: 'completed'
            }]);

        if (recipientTxError) throw recipientTxError;

        // 12. Update AppState
        AppState.currentUser.balance = senderData.balance - amount;

        return {
            success: true,
            sender: sender.name,
            recipient: recipient.name,
            amount: amount,
            newBalance: AppState.currentUser.balance
        };

    } catch (error) {
        console.error('Error sending money:', error);
        return {
            success: false,
            error: error.message || 'Failed to send money'
        };
    }
}

// ============================================
// Send Money Page Initialization
// ============================================

async function initUserSendMoneyPage() {
    console.log('🔷 initUserSendMoneyPage called');

    if (!AppState.currentUser) {
        showMessage('Please login first', 'error');
        navigateTo('user-login');
        return;
    }

    // Load user settings
    const settings = await getUserSettings(AppState.currentUser.id);

    // Display balance
    const balanceEl = document.getElementById('send-money-balance');
    if (balanceEl) {
        balanceEl.textContent = `$${AppState.currentUser.balance.toFixed(2)}`;
    }

    // Display limits
    const limitsEl = document.getElementById('send-money-limits');
    if (limitsEl) {
        limitsEl.innerHTML = `
            <small>Limits: $${settings.transaction_limit}/transaction, $${settings.daily_limit}/day</small>
        `;
    }

    // Check if we came from QR scan
    const emailInput = document.getElementById('send-recipient-email');
    if (AppState.scannerResult && AppState.scannerResult.type === 'user') {
        // Pre-fill with scanned user info
        emailInput.value = AppState.scannerResult.userName || '';
        emailInput.setAttribute('data-user-id', AppState.scannerResult.userId);
        emailInput.readOnly = true; // Make it read-only since we scanned it

        showMessage(`Sending to ${AppState.scannerResult.userName}`, 'success');

        // Clear scanner result
        delete AppState.scannerResult;

        // Focus on amount field
        document.getElementById('send-amount').focus();
    } else {
        // Reset form
        emailInput.value = '';
        emailInput.removeAttribute('data-user-id');
        emailInput.readOnly = false;
    }

    document.getElementById('send-amount').value = '';
    document.getElementById('send-calculated-balance').textContent = '$0.00';

    // Add amount change listener
    const amountInput = document.getElementById('send-amount');
    if (amountInput) {
        amountInput.removeEventListener('input', updateSendCalculatedBalance);
        amountInput.addEventListener('input', updateSendCalculatedBalance);
    }
}

function updateSendCalculatedBalance() {
    const amount = parseFloat(document.getElementById('send-amount').value) || 0;
    const currentBalance = AppState.currentUser.balance;
    const afterBalance = currentBalance - amount;

    const calcEl = document.getElementById('send-calculated-balance');
    if (calcEl) {
        calcEl.textContent = `$${afterBalance.toFixed(2)}`;

        // Color code: red if negative, green if positive
        if (afterBalance < 0) {
            calcEl.style.color = 'var(--danger-color)';
        } else {
            calcEl.style.color = 'var(--primary-color)';
        }
    }
}

async function handleSendMoney() {
    const recipientInput = document.getElementById('send-recipient-email');
    const recipientEmail = recipientInput.value.trim();
    const amount = parseFloat(document.getElementById('send-amount').value);

    // Validation
    if (!recipientEmail) {
        showMessage('Please enter recipient email', 'error');
        return;
    }

    if (!amount || amount <= 0) {
        showMessage('Please enter a valid amount', 'error');
        return;
    }

    // Show loading
    showMessage('Sending money...', 'info');

    // Check if we have a user ID from QR scan
    let recipient;
    const scannedUserId = recipientInput.getAttribute('data-user-id');
    if (scannedUserId) {
        // Use the scanned user ID
        recipient = await findUserById(scannedUserId);
    } else {
        // Find recipient by email
        recipient = await findUserByEmail(recipientEmail);
    }

    if (!recipient) {
        showMessage('Recipient not found. Please check the email address.', 'error');
        return;
    }

    // Send money
    const result = await sendMoneyToUser(
        AppState.currentUser.id,
        recipient.id,
        amount
    );

    if (result.success) {
        showMessage(`Sent $${amount.toFixed(2)} to ${result.recipient}`, 'success');

        // Update display balance
        document.getElementById('send-money-balance').textContent =
            `$${result.newBalance.toFixed(2)}`;

        // Navigate to confirmation
        document.getElementById('send-confirm-recipient').textContent = result.recipient;
        document.getElementById('send-confirm-amount').textContent = `$${amount.toFixed(2)}`;
        document.getElementById('send-confirm-new-balance').textContent = `$${result.newBalance.toFixed(2)}`;

        navigateTo('user-send-confirm');

        // Auto-redirect after 3 seconds
        setTimeout(() => {
            navigateTo('user-dashboard');
        }, 3000);
    } else {
        showMessage(result.error, 'error');
    }
}

function cancelSendMoney() {
    navigateTo('user-dashboard');
}

// ============================================
// Receive Money Page Initialization
// ============================================

async function initUserReceiveMoneyPage() {
    console.log('🔷 initUserReceiveMoneyPage called');

    if (!AppState.currentUser) {
        showMessage('Please login first', 'error');
        navigateTo('user-login');
        return;
    }

    // Display user info
    const nameEl = document.getElementById('receive-money-name');
    if (nameEl) {
        nameEl.textContent = AppState.currentUser.name;
    }

    const balanceEl = document.getElementById('receive-money-balance');
    if (balanceEl) {
        balanceEl.textContent = `$${AppState.currentUser.balance.toFixed(2)}`;
    }

    // Generate QR code with user ID
    const qrData = JSON.stringify({
        type: 'user',
        userId: AppState.currentUser.id,
        userName: AppState.currentUser.name
    });

    const qrContainer = document.getElementById('receive-qr-code');
    if (qrContainer) {
        qrContainer.innerHTML = ''; // Clear previous QR code

        try {
            new QRCode(qrContainer, {
                text: qrData,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (error) {
            console.error('Error generating QR code:', error);
            qrContainer.innerHTML = '<p>Error generating QR code</p>';
        }
    }
}

function closeReceiveMoney() {
    navigateTo('user-dashboard');
}

// ============================================
// User Settings Page Initialization
// ============================================

async function initUserSettingsPage() {
    console.log('🔷 initUserSettingsPage called');

    if (!AppState.currentUser) {
        showMessage('Please login first', 'error');
        navigateTo('user-login');
        return;
    }

    // Load current settings
    const settings = await getUserSettings(AppState.currentUser.id);

    // Populate form
    document.getElementById('settings-transaction-limit').value = settings.transaction_limit;
    document.getElementById('settings-daily-limit').value = settings.daily_limit;
}

async function handleSaveSettings() {
    const transactionLimit = parseFloat(document.getElementById('settings-transaction-limit').value);
    const dailyLimit = parseFloat(document.getElementById('settings-daily-limit').value);

    // Validation
    if (!transactionLimit || transactionLimit <= 0) {
        showMessage('Please enter a valid transaction limit', 'error');
        return;
    }

    if (!dailyLimit || dailyLimit <= 0) {
        showMessage('Please enter a valid daily limit', 'error');
        return;
    }

    if (transactionLimit > dailyLimit) {
        showMessage('Transaction limit cannot exceed daily limit', 'error');
        return;
    }

    // Show loading
    showMessage('Saving settings...', 'info');

    // Save settings
    const result = await updateUserSettings(
        AppState.currentUser.id,
        transactionLimit,
        dailyLimit
    );

    if (result.success) {
        showMessage('Settings updated successfully', 'success');
        setTimeout(() => {
            navigateTo('user-dashboard');
        }, 1500);
    } else {
        showMessage(`Failed to save settings: ${result.error}`, 'error');
    }
}

// ============================================
// Expose functions globally
// ============================================

window.initUserSendMoneyPage = initUserSendMoneyPage;
window.initUserReceiveMoneyPage = initUserReceiveMoneyPage;
window.initUserSettingsPage = initUserSettingsPage;
window.handleSendMoney = handleSendMoney;
window.cancelSendMoney = cancelSendMoney;
window.closeReceiveMoney = closeReceiveMoney;
window.handleSaveSettings = handleSaveSettings;


        // State
        let token = null;
        let currentUser = null;
        let transactions = [];
        let categoryChart = null;

        // Check if user is logged in on page load
        document.addEventListener('DOMContentLoaded', () => {
            token = localStorage.getItem('token');
            const savedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            
            if (token && savedUser) {
                currentUser = savedUser;
                showDashboard();
                loadTransactions();
            }
            
            setupEventListeners();
        });

        function setupEventListeners() {
            document.getElementById('authForm').addEventListener('submit', handleAuth);
            document.getElementById('authSwitchLink').addEventListener('click', toggleAuthMode);
            document.getElementById('transactionForm').addEventListener('submit', addTransaction);
        }

        // Auth functions
        async function handleAuth(e) {
            e.preventDefault();
            const nameInput = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const isSignUp = document.getElementById('authSubmitBtn').textContent === 'Sign Up';

            if (isSignUp) {
                if (!nameInput) { 
                    showAlert('Please enter your name', 'danger','alertContainer'); 
                    return; 
                }
                if (password !== confirmPassword) { 
                    showAlert('Passwords do not match!', 'danger','alertContainer'); 
                    return; 
                }
                if (password.length < 6) { 
                    showAlert('Password must be at least 6 characters!', 'danger','alertContainer'); 
                    return; 
                }

                // Since we don't have a backend, simulate user creation
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                if (users.find(u => u.email === email)) { 
                    showAlert('User already exists! Please sign in.', 'danger','alertContainer'); 
                    return; 
                }

                const newUser = { 
                    id: Date.now().toString(), 
                    name: nameInput, 
                    email, 
                    password: btoa(password) 
                };
                users.push(newUser);
                localStorage.setItem('users', JSON.stringify(users));
                
                currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
                token = 'local_token_' + currentUser.id;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('token', token);
                
                showAlert('Account created successfully!', 'success','alertContainer');
                setTimeout(() => showDashboard(), 900);
            } else {
                // Login logic
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.email === email && u.password === btoa(password));
                if (!user) { 
                    showAlert('Invalid email or password!', 'danger','alertContainer'); 
                    return; 
                }
                
                currentUser = { id: user.id, name: user.name || user.email, email: user.email };
                token = 'local_token_' + currentUser.id;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('token', token);
                
                showDashboard();
                loadTransactions();
            }
        }

        function toggleAuthMode(e) {
            e.preventDefault();
            const isSignIn = document.getElementById('authSubmitBtn').textContent === 'Sign In';
            
            if (isSignIn) {
                document.getElementById('authTitle').textContent = 'Create Account';
                document.querySelector('.subtitle').textContent = 'Join to start tracking your finances';
                document.getElementById('confirmPasswordGroup').classList.remove('hidden');
                document.getElementById('authSubmitBtn').textContent = 'Sign Up';
                document.getElementById('authSwitchText').textContent = 'Already have an account?';
                document.getElementById('authSwitchLink').textContent = 'Sign in here';
            } else {
                document.getElementById('authTitle').textContent = 'Welcome Back';
                document.querySelector('.subtitle').textContent = 'Sign in to your account to continue';
                document.getElementById('confirmPasswordGroup').classList.add('hidden');
                document.getElementById('authSubmitBtn').textContent = 'Sign In';
                document.getElementById('authSwitchText').textContent = "Don't have an account?";
                document.getElementById('authSwitchLink').textContent = 'Sign up here';
            }
            
            document.getElementById('authForm').reset();
            document.getElementById('alertContainer').innerHTML = '';
        }

        function showDashboard() {
            document.getElementById('authSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');
            document.getElementById('userName').textContent = currentUser?.name || currentUser?.email || '';
            updateDashboard();
            initializeCharts();
        }

        function logout() {
            currentUser = null;
            token = null;
            transactions = [];
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            document.getElementById('dashboardSection').classList.add('hidden');
            document.getElementById('authSection').classList.remove('hidden');
            document.getElementById('authForm').reset();
            document.getElementById('alertContainer').innerHTML = '';
            // Reset to sign in mode
            document.getElementById('authTitle').textContent = 'Welcome Back';
            document.querySelector('.subtitle').textContent = 'Sign in to your account to continue';
            document.getElementById('confirmPasswordGroup').classList.add('hidden');
            document.getElementById('authSubmitBtn').textContent = 'Sign In';
            document.getElementById('authSwitchText').textContent = "Don't have an account?";
            document.getElementById('authSwitchLink').textContent = 'Sign up here';
        }

        // Transaction functions
        function addTransaction(e) {
            e.preventDefault();
            if (!currentUser) { 
                showAlert('Please sign in first!', 'danger','dashboardAlerts'); 
                return; 
            }

            const amount = parseFloat(document.getElementById('amount').value);
            const type = document.getElementById('type').value;
            const category = document.getElementById('category').value.trim();
            const description = document.getElementById('description').value.trim();

            if (isNaN(amount) || amount <= 0) { 
                showAlert('Enter a valid amount', 'danger','dashboardAlerts'); 
                return; 
            }
            if (!category) { 
                showAlert('Please enter a category', 'danger','dashboardAlerts'); 
                return; 
            }

            const transaction = {
                id: Date.now().toString(),
                userId: currentUser.id,
                type,
                amount,
                category,
                description,
                date: new Date().toISOString()
            };

            // Save to localStorage
            const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            allTransactions.unshift(transaction);
            localStorage.setItem('transactions', JSON.stringify(allTransactions));

            // Reset form
            document.getElementById('transactionForm').reset();
            document.getElementById('type').value = 'income';
            
            loadTransactions();
            showAlert('Transaction added successfully!', 'success','dashboardAlerts');
        }

        function loadTransactions() {
            if (!currentUser) return;
            
            const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            transactions = allTransactions.filter(t => t.userId === currentUser.id);
            
            // Sort transactions
            const sortBy = document.getElementById('sortBy')?.value || 'amount';
            const sortOrder = document.getElementById('sortOrder')?.value || 'desc';
            
            transactions.sort((a, b) => {
                let aVal = sortBy === 'amount' ? a.amount : new Date(a.date).getTime();
                let bVal = sortBy === 'amount' ? b.amount : new Date(b.date).getTime();
                
                return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
            });
            
            updateDashboard();
            checkNegativeBalance();
        }

        function deleteTransaction(id) {
            if (!confirm('Delete this transaction?')) return;
            
            const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            const updatedTransactions = allTransactions.filter(t => t.id !== id);
            localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
            
            loadTransactions();
            showAlert('Transaction deleted', 'success','dashboardAlerts');
        }

        function checkNegativeBalance() {
            const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const balance = income - expenses;
            
            if (balance < 0) {
                showAlert(`⚠️ WARNING: Your balance is negative! You're ₹${Math.abs(balance).toLocaleString('en-IN')} in deficit!`, 'danger', 'dashboardAlerts');
            }
        }

        // Dashboard update functions
        function updateDashboard() {
            updateStats();
            updateTransactionsList();
            updateCategoryChart();
        }

        function updateStats() {
            const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const balance = income - expenses;
            
            document.getElementById('totalIncome').textContent = `₹${income.toLocaleString('en-IN')}`;
            document.getElementById('totalExpenses').textContent = `₹${expenses.toLocaleString('en-IN')}`;
            
            const balanceEl = document.getElementById('netBalance');
            balanceEl.textContent = `₹${balance.toLocaleString('en-IN')}`;
            balanceEl.style.color = balance >= 0 ? '#36b37e' : '#ff6b6b';
        }

        function updateTransactionsList() {
            const container = document.getElementById('transactionsList');
            if (!transactions || transactions.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#777; padding:20px;">No transactions yet. Add your first transaction!</p>';
                return;
            }
            
            const recent = transactions.slice(0, 12);
            container.innerHTML = recent.map(t => `
                <div class="transaction-item">
                    <div style="flex:1;">
                        <div class="transaction-amount ${t.type}">${t.type === 'income' ? '+' : '-'}₹${t.amount.toLocaleString('en-IN')}</div>
                        <div class="transaction-category">${t.category}</div>
                        <div class="transaction-date">${new Date(t.date).toLocaleDateString('en-IN')}</div>
                        ${t.description ? `<div style="margin-top:6px; color:#8a92a6; font-size:0.86rem;">${t.description}</div>` : ''}
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                        <button class="btn btn-danger btn-small" onclick="deleteTransaction('${t.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        }

        // Chart functions
        function initializeCharts() {
            const ctx = document.getElementById('categoryChart').getContext('2d');
            if (categoryChart) categoryChart.destroy();
            
            categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: { 
                    labels: [], 
                    datasets: [{ 
                        data: [], 
                        backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40','#c9ccd6','#6b7cff'], 
                        borderWidth: 0 
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                        legend: { 
                            position: 'bottom', 
                            labels: { usePointStyle: true } 
                        } 
                    } 
                }
            });
            updateCategoryChart();
        }

        function updateCategoryChart() {
            if (!categoryChart) return;
            
            const expenses = transactions.filter(t => t.type === 'expense');
            if (expenses.length === 0) {
                categoryChart.data.labels = ['No expenses yet'];
                categoryChart.data.datasets[0].data = [1];
                categoryChart.update();
                return;
            }
            
            const categoryTotals = {};
            expenses.forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });
            
            const sortedCategories = Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8);
            
            categoryChart.data.labels = sortedCategories.map(([category]) => category);
            categoryChart.data.datasets[0].data = sortedCategories.map(([, amount]) => amount);
            categoryChart.update();
        }

        // Utility function
        function showAlert(message, type, containerId) {
            const container = document.getElementById(containerId);
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type}`;
            alertDiv.textContent = message;
            container.innerHTML = '';
            container.appendChild(alertDiv);
            setTimeout(() => {
                if (alertDiv.parentNode) alertDiv.remove();
            }, 5000);
        }
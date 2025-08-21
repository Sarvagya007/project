

// variables 
let currentUser = null;
let transactions = [];
let monthlyBudget = 0;
let categoryChart = null;


const incomeCategories = new Set(['salary','freelance','investment','other-income']);

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const savedTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');

  if (savedUser) {
    currentUser = savedUser;
    transactions = savedTransactions.filter(t => t.userId === currentUser.id);
    monthlyBudget = parseFloat(localStorage.getItem(`monthlyBudget_${currentUser.id}`) || '0');
    showDashboard();
  }

  setupEventListeners();

  // default category
  const cat = document.getElementById('category');
  if (cat) cat.value = 'salary';
});

function setupEventListeners() {
  const authForm = document.getElementById('authForm');
  if (authForm) authForm.addEventListener('submit', handleAuth);

  const authSwitchLink = document.getElementById('authSwitchLink');
  if (authSwitchLink) authSwitchLink.addEventListener('click', toggleAuthMode);

  const txForm = document.getElementById('transactionForm');
  if (txForm) txForm.addEventListener('submit', addTransaction);
}

// AUTH
function handleAuth(e) {
  e.preventDefault();
  const nameInput = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const isSignUp = document.getElementById('authSubmitBtn').textContent === 'Sign Up';

  if (isSignUp) {
    if (!nameInput) { showAlert('Please enter your name', 'danger', 'alertContainer'); return; }
    if (password !== confirmPassword) { showAlert('Passwords do not match!', 'danger', 'alertContainer'); return; }
    if (password.length < 6) { showAlert('Password must be at least 6 characters!', 'danger', 'alertContainer'); return; }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === email)) { showAlert('User already exists! Please sign in.', 'danger','alertContainer'); return; }

    const newUser = { id: Date.now().toString(), name: nameInput, email, password: btoa(password) };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showAlert('Account created successfully!', 'success', 'alertContainer');
    setTimeout(() => showDashboard(), 700);
  } else {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === btoa(password));
    if (!user) { showAlert('Invalid email or password!', 'danger','alertContainer'); return; }
    currentUser = { id: user.id, name: user.name || user.email, email: user.email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions = allTransactions.filter(t => t.userId === currentUser.id);
    monthlyBudget = parseFloat(localStorage.getItem(`monthlyBudget_${currentUser.id}`) || '0');
    showDashboard();
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

// DASHBOARD / UI
function showDashboard() {
  document.getElementById('authSection').classList.add('hidden');
  document.getElementById('dashboardSection').classList.remove('hidden');
  document.getElementById('userName').textContent = currentUser.name || currentUser.email;
  updateDashboard();
  initializeCharts();
}

function logout() {
  currentUser = null;
  transactions = [];
  monthlyBudget = 0;
  localStorage.removeItem('currentUser');

  document.getElementById('dashboardSection').classList.add('hidden');
  document.getElementById('authSection').classList.remove('hidden');
  document.getElementById('authForm').reset();
  document.getElementById('alertContainer').innerHTML = '';
  document.getElementById('authTitle').textContent = 'Welcome Back';
  document.querySelector('.subtitle').textContent = 'Sign in to your account to continue';
  document.getElementById('confirmPasswordGroup').classList.add('hidden');
  document.getElementById('authSubmitBtn').textContent = 'Sign In';
  document.getElementById('authSwitchText').textContent = "Don't have an account?";
  document.getElementById('authSwitchLink').textContent = 'Sign up here';
}

// Transaction: category determines type
function getTypeForCategory(category) {
  return incomeCategories.has(category) ? 'income' : 'expense';
}

function addTransaction(e) {
  e.preventDefault();
  if (!currentUser) { showAlert('Please sign in first!', 'danger','dashboardAlerts'); return; }

  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const description = document.getElementById('description').value.trim();

  if (isNaN(amount) || amount <= 0) { showAlert('Enter a valid amount', 'danger','dashboardAlerts'); return; }

  const type = getTypeForCategory(category);

  const transaction = {
    id: Date.now().toString(),
    userId: currentUser.id,
    type,
    amount,
    category,
    description,
    date: new Date().toISOString()
  };

  // Add to front (most recent first)
  transactions.unshift(transaction);

  // Persist to global transactions array in localStorage
  const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  allTransactions.unshift(transaction);
  localStorage.setItem('transactions', JSON.stringify(allTransactions));

  // reset form
  document.getElementById('transactionForm').reset();
  document.getElementById('category').value = 'salary';

  updateDashboard();
  showAlert('Transaction added successfully!', 'success','dashboardAlerts');
}

function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;

  transactions = transactions.filter(t => t.id !== id);

  const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  const updated = allTransactions.filter(t => t.id !== id);
  localStorage.setItem('transactions', JSON.stringify(updated));

  updateDashboard();
  showAlert('Transaction deleted', 'success','dashboardAlerts');
}

// Dashboard updates
function updateDashboard() {
  updateStats();
  updateTransactionsList();
  updateBudgetDisplay();
  updateCategoryChart();
}

function updateStats() {
  const income = transactions.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
  const balance = income - expenses;

  document.getElementById('totalIncome').textContent = `₹${income.toLocaleString('en-IN')}`;
  document.getElementById('totalExpenses').textContent = `₹${expenses.toLocaleString('en-IN')}`;
  const nb = document.getElementById('netBalance');
  nb.textContent = `₹${balance.toLocaleString('en-IN')}`;
  nb.style.color = balance >= 0 ? '#36b37e' : '#ff6b6b';
}

function updateTransactionsList() {
  const container = document.getElementById('transactionsList');
  if (!transactions || transactions.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#777; padding:20px;">No transactions yet. Add your first transaction!</p>';
    return;
  }

  const recent = transactions.slice(0, 12);
  container.innerHTML = recent.map(t => {
    const sign = t.type === 'income' ? '+' : '-';
    const amt = `₹${t.amount.toLocaleString('en-IN')}`;
    const desc = t.description ? `<div style="margin-top:6px; color:#8a92a6; font-size:0.86rem;">${escapeHtml(t.description)}</div>` : '';
    return `
      <div class="transaction-item">
        <div style="flex:1;">
          <div class="transaction-amount ${t.type}">${sign}${amt}</div>
          <div class="transaction-category">${getCategoryName(t.category)}</div>
          <div class="transaction-date">${new Date(t.date).toLocaleDateString('en-IN')}</div>
          ${desc}
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
          <button class="btn btn-danger btn-small" onclick="deleteTransaction('${t.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function getCategoryName(category) {
  const mapping = {
    'salary': 'Salary','freelance':'Freelance','investment':'Investment','other-income':'Other Income',
    'food':'Food & Dining','rent':'Rent & Housing','transport':'Transportation','entertainment':'Entertainment',
    'healthcare':'Healthcare','shopping':'Shopping','utilities':'Utilities','education':'Education',
    'travel':'Travel','other-expense':'Other Expenses'
  };
  return mapping[category] || category;
}

// Budget
function setBudget() {
  const val = parseFloat(document.getElementById('monthlyBudget').value);
  if (isNaN(val) || val <= 0) { showAlert('Please enter a valid budget amount!', 'danger','dashboardAlerts'); return; }
  monthlyBudget = val;
  if (currentUser && currentUser.id) localStorage.setItem(`monthlyBudget_${currentUser.id}`, monthlyBudget.toString());
  updateBudgetDisplay();
  showAlert('Monthly budget updated!', 'success','dashboardAlerts');
}

function updateBudgetDisplay() {
  if (!monthlyBudget || monthlyBudget <= 0) {
    document.getElementById('budgetDisplay').classList.add('hidden');
    return;
  }
  document.getElementById('budgetDisplay').classList.remove('hidden');

  const now = new Date();
  const currentMonth = now.getMonth(), currentYear = now.getFullYear();

  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense')
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((s,t) => s + t.amount, 0);

  const pct = monthlyBudget > 0 ? (monthlyExpenses / monthlyBudget) * 100 : 0;
  const over = pct > 100;

  document.getElementById('monthlyExpenses').textContent = monthlyExpenses.toLocaleString('en-IN');
  document.getElementById('budgetAmount').textContent = monthlyBudget.toLocaleString('en-IN');
  document.getElementById('budgetPercentage').textContent = Math.round(pct) + '%';

  const fill = document.getElementById('budgetFill');
  fill.style.width = Math.min(pct, 100) + '%';
  fill.classList.toggle('over-budget', over);

  if (over) {
    showAlert(`⚠️ Budget Alert: You've exceeded your monthly budget by ₹${(monthlyExpenses - monthlyBudget).toLocaleString('en-IN')}!`, 'warning','dashboardAlerts');
  } else if (pct > 80) {
    showAlert(`⚠️ Budget Warning: You've used ${Math.round(pct)}% of your monthly budget.`, 'warning','dashboardAlerts');
  }
}

// Charts: category doughnut
function initializeCharts() {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: [], datasets: [{ data: [], backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40','#c9ccd6','#6b7cff'], borderWidth:0 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true } } } }
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
  const totals = {};
  expenses.forEach(t => {
    const name = getCategoryName(t.category);
    totals[name] = (totals[name] || 0) + t.amount;
  });
  const sorted = Object.entries(totals).sort(([,a],[,b]) => b - a).slice(0,8);
  categoryChart.data.labels = sorted.map(([name]) => name);
  categoryChart.data.datasets[0].data = sorted.map(([,amt]) => amt);
  categoryChart.update();
}

// Utility
function showAlert(message, type, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const d = document.createElement('div');
  d.className = `alert alert-${type}`;
  d.textContent = message;
  container.innerHTML = '';
  container.appendChild(d);
  setTimeout(() => { if (d.parentNode) d.remove(); }, 5000);
}

// small helper to prevent injected HTML in descriptions
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

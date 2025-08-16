const API_BASE_KEY = 'apiBaseUrl';
let API = localStorage.getItem(API_BASE_KEY) || 'http://192.168.1.125:3000';

function log(message, level = 'log') {
  console[level](`[BrickSync ${new Date().toISOString()}] ${message}`);
}

function logLayout(message) {
  log(`Layout: ${message}`);
}

async function loadTabContent(tab) {
  logLayout(`Attempting to load tab content: ${tab}`);
  const tabContent = document.getElementById('tab-content');
  if (!tabContent) {
    log('Tab content container not found', 'error');
    return;
  }
  try {
    const response = await fetch(`partials/${tab}.html`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const content = await response.text();
    tabContent.innerHTML = content;
    logLayout(`Tab content ${tab} loaded successfully`);
    
    // Reinitialize form listeners and Flatpickr after partial load
    if (tab === 'sales' || tab === 'payments') {
      try {
        flatpickr('#sale-date', { dateFormat: 'd/m/Y' });
        flatpickr('#payment-date', { dateFormat: 'd/m/Y' });
        logLayout('Flatpickr initialized for ' + tab);
      } catch (e) {
        log(`Error initializing Flatpickr for ${tab}: ${e.message}`, 'error');
      }
    }
    setupFormListeners(tab);
    if (tab === 'logs') {
      const clearLogsButton = document.getElementById('clear-logs');
      if (clearLogsButton) {
        clearLogsButton.addEventListener('click', clearLogs);
        logLayout('Clear logs button listener added');
      } else {
        log('Clear logs button not found', 'error');
      }
    }
    // Reload data for the active tab
    await loadData(tab);
    logLayout(`Tab ${tab} fully initialized`);
    // Collapse sidebar on tab click in mobile view
    if (window.innerWidth < 768) {
      toggleSidebar(false);
    }
  } catch (e) {
    log(`Error loading tab content ${tab}: ${e.message}`, 'error');
    tabContent.innerHTML = `<p class="text-red-600 p-4">Error loading ${tab} content: ${e.message}</p>`;
  }
}

async function loadData(activeTab) {
  log(`Starting data load for tab: ${activeTab}`);
  try {
    // Fetch customers (needed for dropdowns and customers tab)
    log('Fetching customers');
    const customers = await fetch(`${API}/customers`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      return r.json();
    });
    log(`Loaded ${customers.length} customers`);
    if (activeTab === 'customers') {
      renderCustomers(customers);
    }
    if (activeTab === 'sales' || activeTab === 'payments') {
      populateCustomerDropdowns(customers, activeTab);
    }
    if (activeTab === 'dashboard') {
      renderDashboard(customers);
    }

    // Fetch and render sales
    if (activeTab === 'sales' || activeTab === 'dashboard') {
      log('Fetching sales');
      const sales = await fetch(`${API}/sales`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      });
      log(`Loaded ${sales.length} sales`);
      renderSales(sales, activeTab);
    }

    // Fetch and render payments
    if (activeTab === 'payments' || activeTab === 'dashboard') {
      log('Fetching payments');
      const payments = await fetch(`${API}/payments`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      });
      log(`Loaded ${payments.length} payments`);
      renderPayments(payments, activeTab);
    }

    // Fetch and render transactions
    if (activeTab === 'transactions') {
      log('Fetching transactions');
      const transactions = await fetch(`${API}/transactions`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      });
      log(`Loaded ${transactions.length} transactions`);
      renderTable('transaction-table', transactions);
    }

    // Fetch and render balances
    if (activeTab === 'balances' || activeTab === 'dashboard') {
      log('Fetching balances');
      const balances = await fetch(`${API}/balances`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      });
      log(`Loaded ${balances.length} balances`);
      if (activeTab === 'dashboard') {
        renderDashboardCharts(balances, [], []); // Pass sales and payments later if needed
      } else {
        renderTable('balance-table', balances);
      }
    }

    // Fetch and render logs
    if (activeTab === 'logs') {
      log('Fetching logs');
      const logs = await fetch(`${API}/logs`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      });
      log(`Loaded ${logs.length} logs`);
      renderLogs(logs);
    }
  } catch (e) {
    log(`Error loading data: ${e.message}`, 'error');
    alert(`Error loading data: ${e.message}. Check API URL in Settings.`);
  }
}

function renderTable(tableId, data) {
  logLayout(`Rendering table ${tableId} with ${data.length} rows`);
  const table = document.getElementById(tableId);
  if (!table) {
    log(`Table ${tableId} not found`, 'error');
    return;
  }
  if (!data.length) {
    table.innerHTML = '<tr><td colspan="100" class="border px-6 py-4 text-center text-slate-500">No data</td></tr>';
    log(`No data for table ${tableId}`);
    return;
  }
  const headers = Object.keys(data[0]);
  table.innerHTML = `
    <thead class="bg-slate-50">
      <tr>${headers.map(h => `<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">${h}</th>`).join('')}${tableId.includes('customer') || tableId.includes('sale') || tableId.includes('payment') ? '<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>' : ''}</tr>
    </thead>
    <tbody class="bg-white divide-y divide-slate-200">${data.map(row => `
      <tr>${headers.map(h => {
        if (h === 'Pending Balance') {
          const value = row[h];
          const formatted = value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
          const color = value < 0 ? 'text-red-600' : 'text-emerald-600';
          return `<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 ${color}">${formatted}</td>`;
        }
        return `<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">${row[h]}</td>`;
      }).join('')}${tableId.includes('customer') ? `<td class="px-6 py-4 whitespace-nowrap"><button class="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 transition-colors" onclick="deleteCustomer('${row['Customer ID']}')">Delete</button></td>` : ''}${tableId.includes('sale') ? `<td class="px-6 py-4 whitespace-nowrap"><button class="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 transition-colors" onclick="deleteSale('${row['Sale ID']}')">Delete</button></td>` : ''}${tableId.includes('payment') ? `<td class="px-6 py-4 whitespace-nowrap"><button class="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 transition-colors" onclick="deletePayment('${row['Payment ID']}')">Delete</button></td>` : ''}</tr>
    `).join('')}</tbody>
  `;
  logLayout(`Table ${tableId} rendered successfully`);
}

function renderCustomers(customers) {
  logLayout(`Rendering customers table with ${customers.length} customers`);
  renderTable('customer-table', customers);
}

function renderSales(sales, activeTab) {
  logLayout(`Rendering sales table with ${sales.length} sales for tab ${activeTab}`);
  if (activeTab === 'dashboard') {
    renderDashboardCharts([], sales, []);
  } else {
    renderTable('sales-table', sales);
  }
}

function renderPayments(payments, activeTab) {
  logLayout(`Rendering payments table with ${payments.length} payments for tab ${activeTab}`);
  if (activeTab === 'dashboard') {
    renderDashboardCharts([], [], payments);
  } else {
    renderTable('payment-table', payments);
  }
}

function renderLogs(logs) {
  logLayout(`Rendering logs with ${logs.length} entries`);
  const logList = document.getElementById('log-list');
  if (!logList) {
    log('Log list not found', 'error');
    return;
  }
  if (!logs.length) {
    logList.innerHTML = '<li class="text-slate-500">No logs available</li>';
    log('No logs to render');
    return;
  }
  logList.innerHTML = logs.map(log => `
    <li class="text-sm text-slate-900">${log.Timestamp}: ${log.Message}</li>
  `).join('');
  logLayout('Logs rendered successfully');
}

function renderDashboard(customers) {
  logLayout(`Rendering dashboard cards with ${customers.length} customers`);
  const totalCustomersCard = document.getElementById('total-customers');
  if (totalCustomersCard) {
    totalCustomersCard.textContent = customers.length;
    logLayout('Total customers card updated');
  } else {
    log('Total customers card not found', 'error');
  }
}

function renderDashboardCharts(balances, sales, payments) {
  logLayout('Rendering dashboard charts');
  const salesChartCanvas = document.getElementById('sales-chart');
  const paymentChartCanvas = document.getElementById('payment-chart');

  if (salesChartCanvas && sales.length) {
    const salesByDate = sales.reduce((acc, sale) => {
      acc[sale.Date] = (acc[sale.Date] || 0) + sale.Amount;
      return acc;
    }, {});
    new Chart(salesChartCanvas, {
      type: 'bar',
      data: {
        labels: Object.keys(salesByDate),
        datasets: [{
          label: 'Sales Amount',
          data: Object.values(salesByDate),
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
    logLayout('Sales chart rendered');
  }

  if (paymentChartCanvas && payments.length) {
    const paymentMethods = payments.reduce((acc, payment) => {
      acc[payment['Payment Method']] = (acc[payment['Payment Method']] || 0) + 1;
      return acc;
    }, {});
    new Chart(paymentChartCanvas, {
      type: 'pie',
      data: {
        labels: Object.keys(paymentMethods),
        datasets: [{
          data: Object.values(paymentMethods),
          backgroundColor: ['rgba(99, 102, 241, 0.6)', 'rgba(16, 185, 129, 0.6)', 'rgba(239, 68, 68, 0.6)', 'rgba(249, 115, 22, 0.6)', 'rgba(107, 114, 128, 0.6)']
        }]
      }
    });
    logLayout('Payment chart rendered');
  }

  if (balances && balances.length) {
    const totalBalanceCard = document.getElementById('total-balance');
    if (totalBalanceCard) {
      const total = balances.reduce((sum, b) => sum + b['Pending Balance'], 0);
      totalBalanceCard.textContent = total.toFixed(2);
      totalBalanceCard.classList.add(total < 0 ? 'text-red-600' : 'text-emerald-600');
      logLayout('Total balance card updated');
    } else {
      log('Total balance card not found', 'error');
    }
  }
}

function populateCustomerDropdowns(customers, activeTab) {
  logLayout(`Populating customer dropdowns with ${customers.length} customers for tab ${activeTab}`);
  const opts = customers.map(c => `<option value="${c['Customer Name']}">${c['Customer Name']}</option>`).join('');
  if (activeTab === 'sales') {
    const saleCustomer = document.getElementById('sale-customer');
    if (saleCustomer) {
      saleCustomer.innerHTML = `<option value="">Select Customer</option>${opts}`;
      logLayout('Sale customer dropdown populated');
    } else {
      log('Sale customer dropdown not found', 'error');
    }
  }
  if (activeTab === 'payments') {
    const paymentCustomer = document.getElementById('payment-customer');
    if (paymentCustomer) {
      paymentCustomer.innerHTML = `<option value="">Select Customer</option>${opts}`;
      logLayout('Payment customer dropdown populated');
    } else {
      log('Payment customer dropdown not found', 'error');
    }
  }
}

async function deleteCustomer(id) {
  log(`Deleting customer ${id}`);
  try {
    const res = await fetch(`${API}/customers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete customer');
    log(`Customer ${id} deleted successfully`);
    await loadData(document.querySelector('.tab-button.active')?.dataset.tab || 'dashboard');
  } catch (e) {
    log(`Error deleting customer ${id}: ${e.message}`, 'error');
    alert(`Error: ${e.message}`);
  }
}

async function deleteSale(id) {
  log(`Deleting sale ${id}`);
  try {
    const res = await fetch(`${API}/sales/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete sale');
    log(`Sale ${id} deleted successfully`);
    await loadData(document.querySelector('.tab-button.active')?.dataset.tab || 'dashboard');
  } catch (e) {
    log(`Error deleting sale ${id}: ${e.message}`, 'error');
    alert(`Error: ${e.message}`);
  }
}

async function deletePayment(id) {
  log(`Deleting payment ${id}`);
  try {
    const res = await fetch(`${API}/payments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete payment');
    log(`Payment ${id} deleted successfully`);
    await loadData(document.querySelector('.tab-button.active')?.dataset.tab || 'dashboard');
  } catch (e) {
    log(`Error deleting payment ${id}: ${e.message}`, 'error');
    alert(`Error: ${e.message}`);
  }
}

async function clearLogs() {
  log(`Clearing logs`);
  try {
    const res = await fetch(`${API}/logs`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to clear logs');
    log(`Logs cleared successfully`);
    await loadData('logs');
  } catch (e) {
    log(`Error clearing logs: ${e.message}`, 'error');
    alert(`Error: ${e.message}`);
  }
}

function updateSaleAmount() {
  const qty = parseFloat(document.getElementById('sale-quantity')?.value) || 0;
  const rate = parseFloat(document.getElementById('sale-rate')?.value) || 0;
  const rent = parseFloat(document.getElementById('sale-vehicle-rent')?.value) || 0;
  const amountInput = document.getElementById('sale-amount');
  if (amountInput) {
    amountInput.value = (qty * rate + rent).toFixed(2);
    logLayout(`Updated sale amount: ${(qty * rate + rent).toFixed(2)}`);
  } else {
    log('Sale amount input not found', 'error');
  }
}

function toggleSidebar(show) {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger-menu');
  if (sidebar && hamburger) {
    if (show) {
      sidebar.classList.remove('hidden');
      sidebar.classList.add('block');
      hamburger.classList.add('hidden');
      logLayout('Sidebar opened');
    } else {
      sidebar.classList.remove('block');
      sidebar.classList.add('hidden');
      hamburger.classList.remove('hidden');
      logLayout('Sidebar collapsed');
    }
  } else {
    log('Sidebar or hamburger menu not found', 'error');
  }
}

function setupFormListeners(tab) {
  logLayout(`Setting up form listeners for tab: ${tab}`);
  if (tab === 'customers') {
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
      customerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('customer-name')?.value.trim();
        log(`Submitting customer form: ${name}`);
        if (!name) {
          log('Customer name is empty', 'error');
          alert('Customer Name is required');
          return;
        }
        try {
          const res = await fetch(`${API}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'Customer Name': name })
          });
          if (!res.ok) throw new Error((await res.json()).error || 'Failed to add customer');
          log(`Customer ${name} added successfully`);
          e.target.reset();
          await loadData('customers');
        } catch (e) {
          log(`Error adding customer: ${e.message}`, 'error');
          alert(`Error: ${e.message}`);
        }
      });
      logLayout('Customer form listener added');
    } else {
      log('Customer form not found', 'error');
    }
  }

  if (tab === 'sales') {
    const salesForm = document.getElementById('sales-form');
    if (salesForm) {
      salesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const saleData = {
          'Customer Name': formData.get('Customer Name'),
          Date: formData.get('Date'),
          Quantity: parseFloat(formData.get('Quantity')) || 0,
          Rate: parseFloat(formData.get('Rate')) || 0,
          'Vehicle Rent': parseFloat(formData.get('Vehicle Rent')) || 0,
          Amount: parseFloat(formData.get('Amount')) || 0,
          'Payment Method': formData.get('Payment Method') || '',
          'Payment Received': parseFloat(formData.get('Payment Received')) || 0,
          Remarks: formData.get('Remarks') || ''
        };
        log(`Submitting sale: ${JSON.stringify(saleData)}`);
        if (!saleData['Customer Name']) return alert('Please select a customer');
        if (!saleData.Date) return alert('Please select a date');
        if (isNaN(saleData.Quantity) || saleData.Quantity <= 0) return alert('Quantity must be a positive number');
        if (isNaN(saleData.Rate) || saleData.Rate <= 0) return alert('Rate must be a positive number');
        if (saleData['Payment Method'] && (isNaN(saleData['Payment Received']) || saleData['Payment Received'] < 0)) {
          return alert('Payment Received must be a non-negative number when a Payment Method is selected');
        }
        try {
          const res = await fetch(`${API}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
          });
          if (!res.ok) throw new Error((await res.json()).error || 'Failed to add sale');
          log(`Sale added successfully`);
          e.target.reset();
          await loadData(tab);
        } catch (e) {
          log(`Error adding sale: ${e.message}`, 'error');
          alert(`Error: ${e.message}`);
        }
      });
      logLayout('Sales form listener added');
      const saleQty = document.getElementById('sale-quantity');
      const saleRate = document.getElementById('sale-rate');
      const saleRent = document.getElementById('sale-vehicle-rent');
      const saleMethod = document.getElementById('sale-payment-method');
      if (saleQty) {
        saleQty.addEventListener('input', updateSaleAmount);
        logLayout('Sale quantity listener added');
      } else {
        log('Sale quantity input not found', 'error');
      }
      if (saleRate) {
        saleRate.addEventListener('input', updateSaleAmount);
        logLayout('Sale rate listener added');
      } else {
        log('Sale rate input not found', 'error');
      }
      if (saleRent) {
        saleRent.addEventListener('input', updateSaleAmount);
        logLayout('Sale vehicle rent listener added');
      } else {
        log('Sale vehicle rent input not found', 'error');
      }
      if (saleMethod) {
        saleMethod.addEventListener('change', (e) => {
          const salePaid = document.getElementById('sale-payment-received');
          if (salePaid) {
            salePaid.required = e.target.value !== '';
            if (!e.target.value) salePaid.value = '';
            log(`Sale payment method changed: ${e.target.value}`);
          } else {
            log('Sale payment received input not found', 'error');
          }
        });
        logLayout('Sale payment method listener added');
      } else {
        log('Sale payment method input not found', 'error');
      }
    } else {
      log('Sales form not found', 'error');
    }
  }

  if (tab === 'payments') {
    const paymentsForm = document.getElementById('payment-form');
    if (paymentsForm) {
      paymentsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const paymentData = {
          'Customer Name': formData.get('Customer Name'),
          Date: formData.get('Date'),
          'Payment Method': formData.get('Payment Method'),
          'Payment Received': parseFloat(formData.get('Payment Received')) || 0,
          Remarks: formData.get('Remarks') || ''
        };
        log(`Submitting payment: ${JSON.stringify(paymentData)}`);
        if (!paymentData['Customer Name']) return alert('Please select a customer');
        if (!paymentData.Date) return alert('Please select a date');
        if (!paymentData['Payment Method']) return alert('Please select a payment method');
        if (isNaN(paymentData['Payment Received']) || paymentData['Payment Received'] <= 0) {
          return alert('Payment Received must be a positive number');
        }
        try {
          const res = await fetch(`${API}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
          });
          if (!res.ok) throw new Error((await res.json()).error || 'Failed to add payment');
          log(`Payment added successfully`);
          e.target.reset();
          await loadData(tab);
        } catch (e) {
          log(`Error adding payment: ${e.message}`, 'error');
          alert(`Error: ${e.message}`);
        }
      });
      logLayout('Payments form listener added');
    } else {
      log('Payments form not found', 'error');
    }
  }

  if (tab === 'settings') {
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const apiUrl = document.getElementById('api-url')?.value.trim();
        log(`Submitting settings form: API URL ${apiUrl}`);
        if (!apiUrl) {
          log('API URL is empty', 'error');
          alert('API URL is required');
          return;
        }
        localStorage.setItem(API_BASE_KEY, apiUrl);
        API = apiUrl;
        log(`API URL updated to ${apiUrl}`);
        alert('API URL updated. Reloading data...');
        await loadData('settings');
      });
      logLayout('Settings form listener added');
      const apiUrlInput = document.getElementById('api-url');
      if (apiUrlInput) {
        apiUrlInput.value = API;
        logLayout(`API URL input initialized: ${API}`);
      } else {
        log('API URL input not found', 'error');
      }
    } else {
      log('Settings form not found', 'error');
    }
  }
}

function setupEventListeners() {
  logLayout('Setting up event listeners');
  const nav = document.querySelector('nav');
  if (nav) {
    logLayout('Navigation bar found');
  } else {
    log('Navigation bar not found', 'error');
  }
  const tabContent = document.getElementById('tab-content');
  if (tabContent) {
    logLayout('Tab content container found');
  } else {
    log('Tab content container not found', 'error');
  }
  const tabButtons = document.querySelectorAll('.tab-button');
  if (tabButtons.length) {
    logLayout(`Found ${tabButtons.length} tab buttons`);
    tabButtons.forEach(button => {
      button.addEventListener('click', async () => {
        logLayout(`Switching to tab: ${button.dataset.tab}`);
        document.querySelectorAll('.tab-button').forEach(btn => {
          btn.classList.remove('active', 'bg-indigo-600', 'text-white', 'md:bg-indigo-100', 'md:text-indigo-800');
          logLayout(`Removed active classes from button: ${btn.dataset.tab}`);
        });
        button.classList.add('active', 'bg-indigo-600', 'text-white', 'md:bg-indigo-100', 'md:text-indigo-800');
        logLayout(`Added active classes to button: ${button.dataset.tab}`);
        await loadTabContent(button.dataset.tab);
      });
    });
  } else {
    log('No tab buttons found', 'error');
  }
  // Setup hamburger menu toggle
  const hamburger = document.getElementById('hamburger-menu');
  if (hamburger) {
    hamburger.addEventListener('click', () => toggleSidebar(true));
    logLayout('Hamburger menu listener added');
  } else {
    log('Hamburger menu not found', 'error');
  }
  // Setup outside click to collapse sidebar
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger-menu');
    if (window.innerWidth < 768 && sidebar && !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
      toggleSidebar(false);
    }
  });
  logLayout('Event listeners setup complete');
}

document.addEventListener('DOMContentLoaded', async () => {
  logLayout('DOM content loaded');
  await setupEventListeners();
  await loadTabContent('dashboard');
});
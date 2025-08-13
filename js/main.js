const API_BASE_KEY = 'apiBaseUrl';
let API = localStorage.getItem(API_BASE_KEY) || 'http://192.168.1.125:3000';

function log(message, level = 'log') {
  console[level](`[BrickSync ${new Date().toISOString()}] ${message}`);
}

async function loadTabContent(tab) {
  log(`Loading tab content: ${tab}`);
  try {
    const response = await fetch(`partials/${tab}.html`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const content = await response.text();
    const tabContent = document.getElementById('tab-content');
    if (tabContent) {
      tabContent.innerHTML = content;
      log(`Tab content ${tab} loaded`);
      // Reinitialize form listeners and Flatpickr after partial load
      if (tab === 'sales' || tab === 'payments') {
        flatpickr('#sale-date', { dateFormat: 'd/m/Y' });
        flatpickr('#payment-date', { dateFormat: 'd/m/Y' });
        log('Flatpickr reinitialized for ' + tab);
      }
      if (tab === 'customers' || tab === 'sales' || tab === 'payments' || tab === 'settings') {
        setupFormListeners(tab);
      }
      if (tab === 'logs') {
        const clearLogsButton = document.getElementById('clear-logs');
        if (clearLogsButton) {
          clearLogsButton.addEventListener('click', clearLogs);
          log('Clear logs button listener added');
        } else {
          log('Clear logs button not found', 'error');
        }
      }
      // Reload data to populate dropdowns and tables
      loadData();
    } else {
      log('Tab content container not found', 'error');
    }
  } catch (e) {
    log(`Error loading tab content ${tab}: ${e.message}`, 'error');
    alert(`Error loading tab: ${e.message}`);
  }
}

async function loadData() {
  log('Starting data load');
  try {
    log('Fetching customers');
    const customers = await fetch(`${API}/customers`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      return r.json();
    });
    log(`Loaded ${customers.length} customers`);
    renderCustomers(customers);
    populateCustomerDropdowns(customers);

    log('Fetching sales');
    const sales = await fetch(`${API}/sales`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      return r.json();
    });
    log(`Loaded ${sales.length} sales`);
    renderSales(sales);

    log('Fetching payments');
    const payments = await fetch(`${API}/payments`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      return r.json();
    });
    log(`Loaded ${payments.length} payments`);
    renderPayments(payments);

    log('Fetching transactions');
    const transactions = await fetch(`${API}/transactions`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      return r.json();
    });
    log(`Loaded ${transactions.length} transactions`);
    renderTable('transaction-table', transactions);

    log('Fetching balances');
    const balances = await fetch(`${API}/balances`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      return r.json();
    });
    log(`Loaded ${balances.length} balances`);
    renderTable('balance-table', balances);

    log('Fetching logs');
    const logs = await fetch(`${API}/logs`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      return r.json();
    });
    log(`Loaded ${logs.length} logs`);
    renderLogs(logs);
  } catch (e) {
    log(`Error loading data: ${e.message}`, 'error');
    alert(`Error loading data: ${e.message}. Check API URL in Settings.`);
  }
}

function renderTable(tableId, data) {
  log(`Rendering table ${tableId} with ${data.length} rows`);
  const table = document.getElementById(tableId);
  if (!table) {
    log(`Table ${tableId} not found`, 'error');
    return;
  }
  if (!data.length) {
    table.innerHTML = '<tr><td colspan="100" class="border px-6 py-4 text-center text-gray-500">No data</td></tr>';
    log(`No data for table ${tableId}`);
    return;
  }
  const headers = Object.keys(data[0]);
  table.innerHTML = `
    <thead class="bg-gray-50">
      <tr>${headers.map(h => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${h}</th>`).join('')}${tableId.includes('customer') || tableId.includes('sale') || tableId.includes('payment') ? '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>' : ''}</tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">${data.map(row => `
      <tr>${headers.map(h => {
        if (h === 'Pending Balance') {
          const value = row[h];
          const formatted = value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
          const color = value < 0 ? 'text-red-600' : 'text-green-600';
          return `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${color}">${formatted}</td>`;
        }
        return `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row[h]}</td>`;
      }).join('')}${tableId.includes('customer') ? `<td class="px-6 py-4 whitespace-nowrap"><button class="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" onclick="deleteCustomer('${row['Customer ID']}')">Delete</button></td>` : ''}${tableId.includes('sale') ? `<td class="px-6 py-4 whitespace-nowrap"><button class="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" onclick="deleteSale('${row['Sale ID']}')">Delete</button></td>` : ''}${tableId.includes('payment') ? `<td class="px-6 py-4 whitespace-nowrap"><button class="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" onclick="deletePayment('${row['Payment ID']}')">Delete</button></td>` : ''}</tr>
    `).join('')}</tbody>
  `;
  log(`Table ${tableId} rendered successfully`);
}

function renderCustomers(customers) {
  log(`Rendering customers table with ${customers.length} customers`);
  renderTable('customer-table', customers);
}

function renderSales(sales) {
  log(`Rendering sales table with ${sales.length} sales`);
  renderTable('sales-table', sales);
}

function renderPayments(payments) {
  log(`Rendering payments table with ${payments.length} payments`);
  renderTable('payment-table', payments);
}

function renderLogs(logs) {
  log(`Rendering logs with ${logs.length} entries`);
  const logList = document.getElementById('log-list');
  if (!logList) {
    log('Log list not found', 'error');
    return;
  }
  if (!logs.length) {
    logList.innerHTML = '<li class="text-gray-500">No logs available</li>';
    log('No logs to render');
    return;
  }
  logList.innerHTML = logs.map(log => `
    <li class="text-sm text-gray-900">${log.Timestamp}: ${log.Message}</li>
  `).join('');
  log('Logs rendered successfully');
}

function populateCustomerDropdowns(customers) {
  log(`Populating customer dropdowns with ${customers.length} customers`);
  const opts = customers.map(c => `<option value="${c['Customer Name']}">${c['Customer Name']}</option>`).join('');
  const saleCustomer = document.getElementById('sale-customer');
  const paymentCustomer = document.getElementById('payment-customer');
  if (saleCustomer) saleCustomer.innerHTML = `<option value="">Select Customer</option>${opts}`;
  else log('Sale customer dropdown not found', 'error');
  if (paymentCustomer) paymentCustomer.innerHTML = `<option value="">Select Customer</option>${opts}`;
  else log('Payment customer dropdown not found', 'error');
}

async function deleteCustomer(id) {
  log(`Deleting customer ${id}`);
  try {
    const res = await fetch(`${API}/customers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete customer');
    log(`Customer ${id} deleted successfully`);
    loadData();
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
    loadData();
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
    loadData();
  } catch (e) {
    log(`Error deleting payment ${id}: ${e.message}`, 'error');
    alert(`Error: ${e.message}`);
  }
}

async function clearLogs() {
  log('Clearing logs');
  try {
    const res = await fetch(`${API}/logs`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to clear logs');
    log('Logs cleared successfully');
    loadData();
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
    log(`Updated sale amount: ${(qty * rate + rent).toFixed(2)}`);
  } else {
    log('Sale amount input not found', 'error');
  }
}

function setupFormListeners(tab) {
  log(`Setting up form listeners for tab: ${tab}`);
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
          loadData();
        } catch (e) {
          log(`Error adding customer: ${e.message}`, 'error');
          alert(`Error: ${e.message}`);
        }
      });
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
          'Payment Method': formData.get('Payment Method'),
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
          log('Sale added successfully');
          e.target.reset();
          loadData();
        } catch (e) {
          log(`Error adding sale: ${e.message}`, 'error');
          alert(`Error: ${e.message}`);
        }
      });
      const saleQty = document.getElementById('sale-quantity');
      const saleRate = document.getElementById('sale-rate');
      const saleRent = document.getElementById('sale-vehicle-rent');
      if (saleQty) saleQty.addEventListener('input', updateSaleAmount);
      else log('Sale quantity input not found', 'error');
      if (saleRate) saleRate.addEventListener('input', updateSaleAmount);
      else log('Sale rate input not found', 'error');
      if (saleRent) saleRent.addEventListener('input', updateSaleAmount);
      else log('Sale vehicle rent input not found', 'error');
      const saleMethod = document.getElementById('sale-payment-method');
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
        if (isNaN(paymentData['Payment Received') || paymentData['Payment Received'] <= 0) {
          return alert('Payment Received must be a positive number');
        }
        try {
          const res = await fetch(`${API}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
          });
          if (!res.ok) throw new Error((await res.json()).error || 'Failed to add payment');
          log('Payment added successfully');
          e.target.reset();
          loadData();
        } catch (e) {
          log(`Error adding payment: ${e.message}`, 'error');
          alert(`Error: ${e.message}`);
        }
      });
    } else {
      log('Payments form not found', 'error');
    }
  }

  if (tab === 'settings') {
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
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
        loadData();
      });
    } else {
      log('Settings form not found', 'error');
    }
  }
}

function setupEventListeners() {
  log('Setting up event listeners');
  const tabButtons = document.querySelectorAll('.tab-button');
  if (tabButtons.length) {
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        log(`Switching to tab: ${button.dataset.tab}`);
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active', 'bg-blue-600', 'text-white', 'md:bg-blue-100'));
        button.classList.add('active', 'bg-blue-600', 'text-white', 'md:bg-blue-100');
        loadTabContent(button.dataset.tab);
      });
    });
  } else {
    log('No tab buttons found', 'error');
  }
  log('Event listeners setup complete');
}

document.addEventListener('DOMContentLoaded', () => {
  log('DOM content loaded');
  setupEventListeners();
  loadTabContent('dashboard');
});
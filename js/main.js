const API_BASE_KEY = 'apiBaseUrl';
let API = localStorage.getItem(API_BASE_KEY) || 'http://192.168.1.125:3000';

async function loadData() {
  try {
    const customers = await fetch(`${API}/customers`).then(r => r.json());
    renderCustomers(customers);
    populateCustomerDropdowns(customers);

    renderTable('salesTable', await fetch(`${API}/sales`).then(r => r.json()));
    renderTable('paymentsTable', await fetch(`${API}/payments`).then(r => r.json()));
    renderTable('transactionsTable', await fetch(`${API}/transactions`).then(r => r.json()));
    renderTable('balancesTable', await fetch(`${API}/balances`).then(r => r.json()));
    renderTable('logsTable', await fetch(`${API}/logs`).then(r => r.json()));
  } catch (e) {
    alert(`Error loading data: ${e.message}. Check API URL in Settings.`);
  }
}

function renderTable(tableId, data) {
  const table = document.getElementById(tableId);
  if (!data.length) {
    table.innerHTML = '<tr><td colspan="100" class="border p-2 text-center">No data</td></tr>';
    return;
  }
  const headers = Object.keys(data[0]);
  table.innerHTML = `
    <thead><tr>${headers.map(h => `<th class="border p-2 bg-gray-100">${h}</th>`).join('')}</tr></thead>
    <tbody>${data.map(row => `
      <tr>${headers.map(h => {
        if (h === 'Pending Balance') {
          const value = row[h];
          const formatted = value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
          const color = value < 0 ? 'text-red-600' : 'text-green-600';
          return `<td class="border p-2 ${color}">${formatted}</td>`;
        }
        return `<td class="border p-2">${row[h]}</td>`;
      }).join('')}</tr>
    `).join('')}</tbody>
  `;
}

function renderCustomers(data) {
  const table = document.getElementById('customersTable');
  if (!data.length) {
    table.innerHTML = '<tr><td colspan="3" class="border p-2 text-center">No data</td></tr>';
    return;
  }
  table.innerHTML = `
    <thead><tr><th class="border p-2 bg-gray-100">Customer ID</th><th class="border p-2 bg-gray-100">Customer Name</th><th class="border p-2 bg-gray-100">Actions</th></tr></thead>
    <tbody>${data.map(c => `
      <tr>
        <td class="border p-2">${c['Customer ID']}</td>
        <td class="border p-2">${c['Customer Name']}</td>
        <td class="border p-2"><button class="bg-red-600 text-white p-1 rounded hover:bg-red-700" onclick="deleteCustomer('${c['Customer ID']}')">Delete</button></td>
      </tr>
    `).join('')}</tbody>
  `;
}

function renderSales(data) {
  const table = document.getElementById('salesTable');
  if (!data.length) {
    table.innerHTML = '<tr><td colspan="100" class="border p-2 text-center">No data</td></tr>';
    return;
  }
  const headers = Object.keys(data[0]);
  table.innerHTML = `
    <thead><tr>${headers.map(h => `<th class="border p-2 bg-gray-100">${h}</th>`).join('')}<th class="border p-2 bg-gray-100">Actions</th></tr></thead>
    <tbody>${data.map(row => `
      <tr>${headers.map(h => `<td class="border p-2">${row[h]}</td>`).join('')}
        <td class="border p-2"><button class="bg-red-600 text-white p-1 rounded hover:bg-red-700" onclick="deleteSale('${row['Sale ID']}')">Delete</button></td>
      </tr>
    `).join('')}</tbody>
  `;
}

function renderPayments(data) {
  const table = document.getElementById('paymentsTable');
  if (!data.length) {
    table.innerHTML = '<tr><td colspan="100" class="border p-2 text-center">No data</td></tr>';
    return;
  }
  const headers = Object.keys(data[0]);
  table.innerHTML = `
    <thead><tr>${headers.map(h => `<th class="border p-2 bg-gray-100">${h}</th>`).join('')}<th class="border p-2 bg-gray-100">Actions</th></tr></thead>
    <tbody>${data.map(row => `
      <tr>${headers.map(h => `<td class="border p-2">${row[h]}</td>`).join('')}
        <td class="border p-2"><button class="bg-red-600 text-white p-1 rounded hover:bg-red-700" onclick="deletePayment('${row['Payment ID']}')">Delete</button></td>
      </tr>
    `).join('')}</tbody>
  `;
}

async function populateCustomerDropdowns(customers) {
  const opts = customers.map(c => `<option value="${c['Customer Name']}">${c['Customer Name']}</option>`).join('');
  document.getElementById('saleCustomer').innerHTML = `<option value="">Select</option>${opts}`;
  document.getElementById('payCustomer').innerHTML = `<option value="">Select</option>${opts}`;
}

async function deleteCustomer(id) {
  try {
    const res = await fetch(`${API}/customers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete customer');
    loadData();
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
}

async function deleteSale(id) {
  try {
    const res = await fetch(`${API}/sales/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete sale');
    loadData();
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
}

async function deletePayment(id) {
  try {
    const res = await fetch(`${API}/payments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete payment');
    loadData();
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
}

async function clearLogs() {
  try {
    const res = await fetch(`${API}/logs`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to clear logs');
    loadData();
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
}

document.getElementById('customerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('custName').value.trim();
  if (!name) return alert('Customer Name is required');

  try {
    const res = await fetch(`${API}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'Customer Name': name })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to add customer');
    e.target.reset();
    loadData();
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
});

document.getElementById('salesForm').addEventListener('submit', async (e) => {
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
    e.target.reset();
    loadData();
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
});

document.getElementById('paymentsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const paymentData = {
    'Customer Name': formData.get('Customer Name'),
    Date: formData.get('Date'),
    'Payment Method': formData.get('Payment Method'),
    'Payment Received': parseFloat(formData.get('Payment Received')) || 0,
    Remarks: formData.get('Remarks') || ''
  };

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
    e.target.reset();
    loadData();
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
});

function updateSaleAmount() {
  const qty = parseFloat(document.getElementById('saleQty').value) || 0;
  const rate = parseFloat(document.getElementById('saleRate').value) || 0;
  const rent = parseFloat(document.getElementById('saleRent').value) || 0;
  document.getElementById('saleAmount').value = (qty * rate + rent).toFixed(2);
}

document.getElementById('saleQty').addEventListener('input', updateSaleAmount);
document.getElementById('saleRate').addEventListener('input', updateSaleAmount);
document.getElementById('saleRent').addEventListener('input', updateSaleAmount);

document.getElementById('saleMethod').addEventListener('change', (e) => {
  const salePaid = document.getElementById('salePaid');
  salePaid.required = e.target.value !== '';
  if (!e.target.value) salePaid.value = '';
});

document.getElementById('settingsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const apiUrl = document.getElementById('apiUrl').value.trim();
  if (!apiUrl) return alert('API URL is required');
  localStorage.setItem(API_BASE_KEY, apiUrl);
  API = apiUrl;
  alert('API URL updated. Reloading data...');
  loadData();
});

// Tab Navigation
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    button.classList.add('active');
    document.getElementById(button.dataset.tab).classList.remove('hidden');
  });
});

// Initialize Flatpickr
flatpickr('#saleDate', { dateFormat: 'd/m/Y' });
flatpickr('#payDate', { dateFormat: 'd/m/Y' });

// Initialize API URL
document.getElementById('apiUrl').value = API;

// Load Data
loadData();
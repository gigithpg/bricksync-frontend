import { showDeleteModal } from './main.js';

export function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded shadow-lg';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function showLoadingSpinner() {
  const spinner = document.createElement('div');
  spinner.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center';
  spinner.innerHTML = '<div class="animate-spin-slow h-8 w-8 border-4 border-indigo-600 rounded-full"></div>';
  document.body.appendChild(spinner);
  return spinner;
}

export function hideLoadingSpinner(spinner) {
  if (spinner) spinner.remove();
}

export function renderCustomers(data, renderFunctions) {
  const tbody = document.getElementById('customers-table-body');
  tbody.innerHTML = '';
  data.forEach(({ name }) => {
    const row = document.createElement('tr');
    row.className = 'border-t';
    row.innerHTML = `
      <td class="px-4 py-2 truncate">${name}</td>
      <td class="px-4 py-2">
        <button class="btn bg-red-600 hover:bg-red-700" data-name="${name}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
    row.querySelector('button').addEventListener('click', () => showDeleteModal(name, 'customer', null, renderFunctions));
  });
}

export function renderSales(data, renderFunctions) {
  const tbody = document.getElementById('sales-table-body');
  tbody.innerHTML = '';
  data.forEach(sale => {
    const row = document.createElement('tr');
    row.className = 'border-t';
    row.innerHTML = `
      <td class="px-4 py-2 truncate">${sale['Customer Name']}</td>
      <td class="px-4 py-2 truncate">${sale.Date}</td>
      <td class="px-4 py-2 truncate">${sale.Quantity}</td>
      <td class="px-4 py-2 truncate">${sale.Rate}</td>
      <td class="px-4 py-2 truncate">${sale.Amount}</td>
      <td class="px-4 py-2">
        <button class="btn bg-red-600 hover:bg-red-700" data-id="${sale.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
    row.querySelector('button').addEventListener('click', () => showDeleteModal(sale['Customer Name'], 'sale', sale.id, renderFunctions));
  });
}

export function renderPayments(data, renderFunctions) {
  const tbody = document.getElementById('payments-table-body');
  tbody.innerHTML = '';
  data.forEach(payment => {
    const row = document.createElement('tr');
    row.className = 'border-t';
    row.innerHTML = `
      <td class="px-4 py-2 truncate">${payment['Customer Name']}</td>
      <td class="px-4 py-2 truncate">${payment.Date}</td>
      <td class="px-4 py-2 truncate">${payment.Amount}</td>
      <td class="px-4 py-2">
        <button class="btn bg-red-600 hover:bg-red-700" data-id="${payment.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
    row.querySelector('button').addEventListener('click', () => showDeleteModal(payment['Customer Name'], 'payment', payment.id, renderFunctions));
  });
}

export function renderTransactions(data) {
  const tbody = document.getElementById('transactions-table-body');
  tbody.innerHTML = '';
  data.forEach(tx => {
    const row = document.createElement('tr');
    row.className = 'border-t';
    row.innerHTML = `
      <td class="px-4 py-2 truncate">${tx['Customer Name']}</td>
      <td class="px-4 py-2 truncate">${tx.Date}</td>
      <td class="px-4 py-2 truncate">${tx.Type}</td>
      <td class="px-4 py-2 truncate">${tx.Amount}</td>
      <td class="px-4 py-2">
        <button class="btn bg-red-600 hover:bg-red-700" data-id="${tx.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

export function renderBalances(data) {
  const tbody = document.getElementById('balances-table-body');
  tbody.innerHTML = '';
  data.forEach(balance => {
    const row = document.createElement('tr');
    row.className = 'border-t';
    row.innerHTML = `
      <td class="px-4 py-2 truncate">${balance['Customer Name']}</td>
      <td class="px-4 py-2 truncate">${balance.Balance}</td>
    `;
    tbody.appendChild(row);
  });
}

export function renderLogs(data) {
  const tbody = document.getElementById('logs-table-body');
  tbody.innerHTML = '';
  data.forEach(log => {
    const row = document.createElement('tr');
    row.className = 'border-t';
    row.innerHTML = `
      <td class="px-4 py-2 truncate">${log.timestamp}</td>
      <td class="px-4 py-2 truncate">${log.message}</td>
    `;
    tbody.appendChild(row);
  });
  document.getElementById('clear-logs')?.addEventListener('click', () => showDeleteModal('all logs', 'logs', null, renderFunctions));
}

export function renderDashboard(data) {
  document.getElementById('total-balance').textContent = data.totalBalance || 0;
  new window.Chart(document.getElementById('balance-chart'), {
    type: 'bar',
    data: {
      labels: data.balances.map(b => b['Customer Name']),
      datasets: [{
        label: 'Balance',
        data: data.balances.map(b => b.Balance),
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });
  // Add sales chart similarly
}
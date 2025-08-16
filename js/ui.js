import { log } from './api.js';

export function logLayout(message) {
  log(`Layout: ${message}`);
}

export function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
    logLayout(`Toast shown: ${message}`);
  }
}

export function showLoadingSpinner(tab) {
  const spinner = document.getElementById(`loading-spinner-${tab}`);
  if (spinner) spinner.classList.remove('hidden');
}

export function hideLoadingSpinner(tab) {
  const spinner = document.getElementById(`loading-spinner-${tab}`);
  if (spinner) spinner.classList.add('hidden');
}

export function renderTable(tableId, data, activeTab, sortBy = null, sortOrder = 'asc') {
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
  let sortedData = [...data];
  if (sortBy === 'Date') {
    sortedData.sort((a, b) => {
      const dateA = new Date(a[sortBy].split('/').reverse().join('-'));
      const dateB = new Date(b[sortBy].split('/').reverse().join('-'));
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }
  const headers = Object.keys(data[0]);
  table.innerHTML = `
    <thead class="bg-slate-50">
      <tr>${headers.map(h => `<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer" data-sort="${h}">${h}${h === 'Date' ? `<span class="ml-2">${sortBy === 'Date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>` : ''}</th>`).join('')}${tableId.includes('customer') || tableId.includes('sale') || tableId.includes('payment') ? '<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>' : ''}</tr>
    </thead>
    <tbody class="bg-white divide-y divide-slate-200">${sortedData.map(row => `
      <tr>${headers.map(h => {
        if (h === 'Pending Balance') {
          const value = row[h];
          const formatted = value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
          const color = value < 0 ? 'text-red-600' : 'text-emerald-600';
          return `<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 ${color}">${formatted}</td>`;
        }
        return `<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">${row[h]}</td>`;
      }).join('')}${tableId.includes('customer') ? `<td class="px-6 py-4 whitespace-nowrap"><button class="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 transition-colors delete-customer" data-name="${row['Customer Name']}">Delete</button></td>` : ''}${tableId.includes('sale') ? `<td class="px-6 py-4 whitespace-nowrap"><button class="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 transition-colors delete-sale" data-id="${row['Sale ID']}">Delete</button></td>` : ''}${tableId.includes('payment') ? `<td class="px-6 py-4 whitespace-nowrap"><button class="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 transition-colors delete-payment" data-id="${row['Payment ID']}">Delete</button></td>` : ''}</tr>
    `).join('')}</tbody>
  `;
}

export function renderCustomers(customers, activeTab) {
  logLayout(`Rendering customers table with ${customers.length} customers`);
  renderTable('customer-table', customers, activeTab);
}

export function renderSales(sales, activeTab) {
  logLayout(`Rendering sales table with ${sales.length} sales for tab ${activeTab}`);
  if (activeTab === 'dashboard') {
    renderDashboardCharts([], sales, []);
  } else {
    renderTable('sales-table', sales, activeTab);
  }
}

export function renderPayments(payments, activeTab) {
  logLayout(`Rendering payments table with ${payments.length} payments for tab ${activeTab}`);
  if (activeTab === 'dashboard') {
    renderDashboardCharts([], [], payments);
  } else {
    renderTable('payment-table', payments, activeTab);
  }
}

export function renderLogs(logs) {
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

export function renderDashboard(customers) {
  logLayout(`Rendering dashboard cards with ${customers.length} customers`);
  const totalCustomersCard = document.getElementById('total-customers');
  if (totalCustomersCard) {
    totalCustomersCard.textContent = customers.length;
    logLayout('Total customers card updated');
  } else {
    log('Total customers card not found', 'error');
  }
}

export function renderDashboardCharts(balances, sales, payments) {
  logLayout('Rendering dashboard charts');
  const salesChartCanvas = document.getElementById('sales-chart');
  const salesPerCustomerCanvas = document.getElementById('sales-per-customer-chart');
  const paymentPerCustomerCanvas = document.getElementById('payment-per-customer-chart');
  const balanceChartCanvas = document.getElementById('balance-chart');

  if (salesChartCanvas && sales.length) {
    let filteredSales = [...sales];
    const dateFilter = document.getElementById('sales-date-filter');
    const monthFilter = document.getElementById('sales-month-filter');
    const yearFilter = document.getElementById('sales-year-filter');
    
    const applySalesFilters = () => {
      filteredSales = [...sales];
      if (dateFilter.value) {
        filteredSales = filteredSales.filter(s => s.Date === dateFilter.value);
      } else if (monthFilter.value && yearFilter.value) {
        const [filterYear, filterMonth] = monthFilter.value.split('-');
        filteredSales = filteredSales.filter(s => {
          const [day, month, year] = s.Date.split('/');
          return year === filterYear && month === filterMonth.padStart(2, '0');
        });
      } else if (yearFilter.value) {
        filteredSales = filteredSales.filter(s => s.Date.endsWith(yearFilter.value));
      }
      const salesByDate = filteredSales.reduce((acc, sale) => {
        acc[sale.Date] = (acc[sale.Date] || 0) + sale.Amount;
        return acc;
      }, {});
      const chart = Chart.getChart(salesChartCanvas);
      if (chart) chart.destroy();
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
          scales: { y: { beginAtZero: true } }
        }
      });
      logLayout('Sales chart rendered');
    };

    dateFilter.addEventListener('change', applySalesFilters);
    monthFilter.addEventListener('change', () => {
      if (monthFilter.value) dateFilter.value = '';
      applySalesFilters();
    });
    yearFilter.addEventListener('change', () => {
      if (yearFilter.value) dateFilter.value = '';
      applySalesFilters();
    });
    applySalesFilters();
  }

  if (salesPerCustomerCanvas && sales.length) {
    const salesByCustomer = sales.reduce((acc, sale) => {
      acc[sale['Customer Name']] = (acc[sale['Customer Name']] || 0) + sale.Amount;
      return acc;
    }, {});
    new Chart(salesPerCustomerCanvas, {
      type: 'pie',
      data: {
        labels: Object.keys(salesByCustomer),
        datasets: [{
          data: Object.values(salesByCustomer),
          backgroundColor: ['rgba(99, 102, 241, 0.6)', 'rgba(16, 185, 129, 0.6)', 'rgba(239, 68, 68, 0.6)', 'rgba(249, 115, 22, 0.6)', 'rgba(107, 114, 128, 0.6)']
        }]
      }
    });
    logLayout('Sales per customer chart rendered');
  }

  if (paymentPerCustomerCanvas && payments.length) {
    const paymentsByCustomer = payments.reduce((acc, payment) => {
      acc[payment['Customer Name']] = (acc[payment['Customer Name']] || 0) + payment['Payment Received'];
      return acc;
    }, {});
    new Chart(paymentPerCustomerCanvas, {
      type: 'pie',
      data: {
        labels: Object.keys(paymentsByCustomer),
        datasets: [{
          data: Object.values(paymentsByCustomer),
          backgroundColor: ['rgba(99, 102, 241, 0.6)', 'rgba(16, 185, 129, 0.6)', 'rgba(239, 68, 68, 0.6)', 'rgba(249, 115, 22, 0.6)', 'rgba(107, 114, 128, 0.6)']
        }]
      }
    });
    logLayout('Payments per customer chart rendered');
  }

  if (balanceChartCanvas && balances.length) {
    const balanceByCustomer = balances.reduce((acc, b) => {
      acc[b['Customer Name']] = b['Pending Balance'];
      return acc;
    }, {});
    new Chart(balanceChartCanvas, {
      type: 'line',
      data: {
        labels: Object.keys(balanceByCustomer),
        datasets: [{
          label: 'Pending Balance',
          data: Object.values(balanceByCustomer),
          borderColor: 'rgba(16, 185, 129, 1)',
          fill: false
        }]
      },
      options: {
        scales: { y: { beginAtZero: true } }
      }
    });
    logLayout('Balance chart rendered');
  }

  if (balances && balances.length) {
    const totalBalanceCard = document.getElementById('total-balance');
    if (totalBalanceCard) {
      const total = balances.reduce((sum, b) => sum + b['Pending Balance'], 0);
      totalBalanceCard.textContent = total.toFixed(2);
      totalBalanceCard.classList.add(total < 0 ? 'text-red-600' : 'text-emerald-600');
      logLayout('Total balance card updated');
    }
    const totalSalesCard = document.getElementById('total-sales');
    if (totalSalesCard && sales.length) {
      const totalSales = sales.reduce((sum, s) => sum + s.Amount, 0);
      totalSalesCard.textContent = totalSales.toFixed(2);
      logLayout('Total sales card updated');
    }
    const totalPaymentsCard = document.getElementById('total-payments');
    if (totalPaymentsCard && payments.length) {
      const totalPayments = payments.reduce((sum, p) => sum + p['Payment Received'], 0);
      totalPaymentsCard.textContent = totalPayments.toFixed(2);
      logLayout('Total payments card updated');
    }
  }
}

export function populateCustomerDropdowns(customers, activeTab) {
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
    const filterCustomer = document.getElementById('sales-table-filter-customer');
    if (filterCustomer) {
      filterCustomer.innerHTML = `<option value="">All Customers</option>${opts}`;
      logLayout('Sales filter dropdown populated');
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
    const filterCustomer = document.getElementById('payment-table-filter-customer');
    if (filterCustomer) {
      filterCustomer.innerHTML = `<option value="">All Customers</option>${opts}`;
      logLayout('Payments filter dropdown populated');
    }
  }
  if (activeTab === 'transactions') {
    const filterCustomer = document.getElementById('transaction-table-filter-customer');
    if (filterCustomer) {
      filterCustomer.innerHTML = `<option value="">All Customers</option>${opts}`;
      logLayout('Transactions filter dropdown populated');
    }
  }
}

export function toggleSidebar(show) {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger-menu');
  if (sidebar && hamburger) {
    sidebar.classList.add('transition-none');
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
    setTimeout(() => sidebar.classList.remove('transition-none'), 0);
  } else {
    log('Sidebar or hamburger menu not found', 'error');
  }
}
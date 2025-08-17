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
    table.innerHTML = '<tr><td colspan="100" class="border px-4 py-2 text-center text-gray-500">No data</td></tr>';
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
    <thead class="bg-gray-100">
      <tr>${headers.map(h => `<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer truncate" data-sort="${h}">${h}${h === 'Date' ? `<span class="ml-2">${sortBy === 'Date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>` : ''}</th>`).join('')}${tableId.includes('customer') || tableId.includes('sale') || tableId.includes('payment') ? '<th class="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>' : ''}</tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">${sortedData.map(row => `
      <tr>${headers.map(h => {
        if (h === 'Pending Balance') {
          const value = row[h];
          const formatted = value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
          const color = value < 0 ? 'text-red-600' : 'text-indigo-600';
          return `<td class="px-4 py-2 text-sm text-gray-900 ${color} truncate">${formatted}</td>`;
        }
        return `<td class="px-4 py-2 text-sm text-gray-900 truncate">${row[h]}</td>`;
      }).join('')}${tableId.includes('customer') ? `<td class="px-4 py-2"><button class="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 transition-colors delete-customer" data-name="${row['Customer Name']}">Delete</button></td>` : ''}${tableId.includes('sale') ? `<td class="px-4 py-2"><button class="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 transition-colors delete-sale" data-id="${row['Sale ID']}">Delete</button></td>` : ''}${tableId.includes('payment') ? `<td class="px-4 py-2"><button class="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 transition-colors delete-payment" data-id="${row['Payment ID']}">Delete</button></td>` : ''}</tr>
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
    logList.innerHTML = '<li class="text-gray-500">No logs available</li>';
    log('No logs to render');
    return;
  }
  logList.innerHTML = logs.map(log => `
    <li class="text-sm text-gray-700">${log.Timestamp}: ${log.Message}</li>
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

  const chartColors = {
    background: 'rgba(99, 102, 241, 0.2)', // Indigo with opacity
    border: 'rgba(99, 102, 241, 1)', // Solid indigo
  };

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
      const labels = Object.keys(salesByDate).sort((a, b) => {
        const dateA = new Date(a.split('/').reverse().join('-'));
        const dateB = new Date(b.split('/').reverse().join('-'));
        return dateA - dateB;
      });
      const data = labels.map(date => salesByDate[date]);

      if (window.salesChartInstance) window.salesChartInstance.destroy();
      window.salesChartInstance = new Chart(salesChartCanvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Sales by Date',
            data,
            backgroundColor: chartColors.background,
            borderColor: chartColors.border,
            borderWidth: 2,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: 'Date', color: '#4b5563' } },
            y: { title: { display: true, text: 'Amount', color: '#4b5563' }, beginAtZero: true },
          },
          plugins: { legend: { labels: { color: '#4b5563' } } },
        },
      });
    };

    applySalesFilters();
    dateFilter.addEventListener('change', applySalesFilters);
    monthFilter.addEventListener('change', applySalesFilters);
    yearFilter.addEventListener('change', applySalesFilters);
    logLayout('Sales chart rendered');
  }

  if (salesPerCustomerCanvas && sales.length) {
    const salesByCustomer = sales.reduce((acc, sale) => {
      acc[sale['Customer Name']] = (acc[sale['Customer Name']] || 0) + sale.Amount;
      return acc;
    }, {});
    const labels = Object.keys(salesByCustomer);
    const data = labels.map(customer => salesByCustomer[customer]);

    if (window.salesPerCustomerChartInstance) window.salesPerCustomerChartInstance.destroy();
    window.salesPerCustomerChartInstance = new Chart(salesPerCustomerCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Sales per Customer',
          data,
          backgroundColor: chartColors.background,
          borderColor: chartColors.border,
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 'Customer', color: '#4b5563' } },
          y: { title: { display: true, text: 'Amount', color: '#4b5563' }, beginAtZero: true },
        },
        plugins: { legend: { labels: { color: '#4b5563' } } },
      },
    });
    logLayout('Sales per customer chart rendered');
  }

  if (paymentPerCustomerCanvas && payments.length) {
    const paymentsByCustomer = payments.reduce((acc, payment) => {
      acc[payment['Customer Name']] = (acc[payment['Customer Name']] || 0) + payment['Payment Received'];
      return acc;
    }, {});
    const labels = Object.keys(paymentsByCustomer);
    const data = labels.map(customer => paymentsByCustomer[customer]);

    if (window.paymentPerCustomerChartInstance) window.paymentPerCustomerChartInstance.destroy();
    window.paymentPerCustomerChartInstance = new Chart(paymentPerCustomerCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Payments per Customer',
          data,
          backgroundColor: chartColors.background,
          borderColor: chartColors.border,
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 'Customer', color: '#4b5563' } },
          y: { title: { display: true, text: 'Amount', color: '#4b5563' }, beginAtZero: true },
        },
        plugins: { legend: { labels: { color: '#4b5563' } } },
      },
    });
    logLayout('Payments per customer chart rendered');
  }

  if (balanceChartCanvas && balances.length) {
    const labels = balances.map(b => b['Customer Name']);
    const data = balances.map(b => b['Pending Balance']);

    if (window.balanceChartInstance) window.balanceChartInstance.destroy();
    window.balanceChartInstance = new Chart(balanceChartCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Balance by Customer',
          data,
          backgroundColor: data.map(value => value >= 0 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
          borderColor: data.map(value => value >= 0 ? 'rgba(99, 102, 241, 1)' : 'rgba(239, 68, 68, 1)'),
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 'Customer', color: '#4b5563' } },
          y: { title: { display: true, text: 'Balance', color: '#4b5563' } },
        },
        plugins: { legend: { labels: { color: '#4b5563' } } },
      },
    });
    logLayout('Balance chart rendered');
  }
}

export function populateCustomerDropdowns(customers, activeTab) {
  logLayout(`Populating customer dropdowns with ${customers.length} customers for tab ${activeTab}`);
  const dropdowns = [
    document.getElementById(`${activeTab === 'sales' ? 'sale' : 'payment'}-customer`),
    document.getElementById(`${activeTab}-table-filter-customer`),
  ].filter(Boolean);
  dropdowns.forEach(dropdown => {
    if (dropdown) {
      dropdown.innerHTML = `<option value="">${activeTab === 'sales' ? 'Select Customer' : 'All Customers'}</option>` + customers.map(c => `<option value="${c['Customer Name']}">${c['Customer Name']}</option>`).join('');
      logLayout(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} ${dropdown.id.includes('filter') ? 'filter' : 'customer'} dropdown populated`);
    } else {
      log(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} dropdown not found`, 'error');
    }
  });
}

export function toggleSidebar(show) {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('hidden', !show);
    logLayout(`Sidebar ${show ? 'shown' : 'hidden'}`);
  } else {
    log('Sidebar not found', 'error');
  }
}
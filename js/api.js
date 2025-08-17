export const API_BASE_KEY = 'apiBaseUrl';
export const DEFAULT_API = 'http://192.168.1.125:3000';
export let API = localStorage.getItem(API_BASE_KEY) || DEFAULT_API;

export function log(message, level = 'log') {
  console[level](`[BrickSync ${new Date().toISOString()}] ${message}`);
}

export async function checkApiUrl() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  log(`Checking API URL. Is mobile: ${isMobile}, Current API: ${API}`);
  
  if (localStorage.getItem('apiValid') === API) {
    log(`Using cached API: ${API}`);
    return true;
  }

  try {
    const response = await fetch(`${API}/customers`, { method: 'GET', signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      localStorage.setItem('apiValid', API);
      log(`API ${API} is valid`);
      return true;
    } else {
      log(`API ${API} returned HTTP ${response.status}: ${response.statusText}`, 'warn');
    }
  } catch (e) {
    log(`API ${API} unreachable: ${e.message}`, 'warn');
  }

  if (API !== DEFAULT_API) {
    try {
      const response = await fetch(`${DEFAULT_API}/customers`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        API = DEFAULT_API;
        localStorage.setItem(API_BASE_KEY, API);
        localStorage.setItem('apiValid', API);
        log(`API switched to ${DEFAULT_API}`);
        return true;
      } else {
        log(`Default API (${DEFAULT_API}) returned HTTP ${response.status}: ${response.statusText}`, 'warn');
      }
    } catch (e) {
      log(`Default API (${DEFAULT_API}) unreachable: ${e.message}`, 'warn');
    }
  }

  if (isMobile) {
    try {
      const response = await fetch('http://localhost:3000/customers', { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        API = 'http://localhost:3000';
        localStorage.setItem(API_BASE_KEY, API);
        localStorage.setItem('apiValid', API);
        log(`API switched to localhost:3000`);
        return true;
      } else {
        log(`Localhost API returned HTTP ${response.status}: ${response.statusText}`, 'warn');
      }
    } catch (e) {
      log(`Localhost API unreachable: ${e.message}`, 'warn');
    }
  }

  log('No API reachable. Please check Settings.', 'error');
  return false;
}

export async function loadData(activeTab, renderFunctions) {
  log(`Starting data load for tab: ${activeTab}`);
  try {
    const apiAvailable = await checkApiUrl();
    if (!apiAvailable) {
      const cachedData = {
        customers: JSON.parse(localStorage.getItem('customer-table-data') || '[]'),
        sales: JSON.parse(localStorage.getItem('sales-table-data') || '[]'),
        payments: JSON.parse(localStorage.getItem('payment-table-data') || '[]'),
        transactions: JSON.parse(localStorage.getItem('transaction-table-data') || '[]'),
        balances: JSON.parse(localStorage.getItem('balance-table-data') || '[]'),
        logs: JSON.parse(localStorage.getItem('log-table-data') || '[]')
      };
      if (cachedData[activeTab].length) {
        log(`Using cached data for ${activeTab}`);
        renderTabWithCachedData(activeTab, cachedData, renderFunctions);
        return;
      }
      throw new Error('No valid API available. Please check Settings.');
    }

    const { renderCustomers, renderSales, renderPayments, renderDashboard, renderDashboardCharts, populateCustomerDropdowns } = renderFunctions;

    log('Fetching customers');
    const customers = await fetch(`${API}/customers`).then(async r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
      return r.json();
    });
    log(`Loaded ${customers.length} customers`);
    localStorage.setItem('customer-table-data', JSON.stringify(customers));
    if (activeTab === 'customers') {
      renderCustomers(customers, activeTab);
    }
    if (activeTab === 'sales' || activeTab === 'payments' || activeTab === 'transactions') {
      populateCustomerDropdowns(customers, activeTab);
    }
    if (activeTab === 'dashboard') {
      renderDashboard(customers);
    }

    let sales = [];
    if (activeTab === 'sales' || activeTab === 'dashboard' || activeTab === 'transactions') {
      log('Fetching sales');
      sales = await fetch(`${API}/sales`).then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
        return r.json();
      });
      log(`Loaded ${sales.length} sales`);
      localStorage.setItem('sales-table-data', JSON.stringify(sales));
      if (activeTab === 'sales') {
        renderSales(sales, activeTab);
      }
    }

    let payments = [];
    if (activeTab === 'payments' || activeTab === 'dashboard' || activeTab === 'transactions') {
      log('Fetching payments');
      payments = await fetch(`${API}/payments`).then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
        return r.json();
      });
      log(`Loaded ${payments.length} payments`);
      localStorage.setItem('payment-table-data', JSON.stringify(payments));
      if (activeTab === 'payments') {
        renderPayments(payments, activeTab);
      }
    }

    if (activeTab === 'transactions') {
      log('Fetching transactions');
      const transactions = await fetch(`${API}/transactions`).then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
        return r.json();
      });
      log(`Loaded ${transactions.length} transactions`);
      localStorage.setItem('transaction-table-data', JSON.stringify(transactions));
      renderFunctions.renderTable('transaction-table', transactions, activeTab);
    }

    if (activeTab === 'balances' || activeTab === 'dashboard') {
      log('Fetching balances');
      const balances = await fetch(`${API}/balances`).then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
        return r.json();
      });
      log(`Loaded ${balances.length} balances`);
      localStorage.setItem('balance-table-data', JSON.stringify(balances));
      if (activeTab === 'dashboard') {
        renderDashboardCharts(balances, sales, payments);
      } else {
        renderFunctions.renderTable('balance-table', balances, activeTab);
      }
    }

    if (activeTab === 'logs') {
      log('Fetching logs');
      const logs = await fetch(`${API}/logs`).then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
        return r.json();
      });
      log(`Loaded ${logs.length} logs`);
      localStorage.setItem('log-table-data', JSON.stringify(logs));
      renderFunctions.renderLogs(logs);
    }
  } catch (e) {
    log(`Error loading data: ${e.message}`, 'error');
    throw e;
  }
}

function renderTabWithCachedData(activeTab, cachedData, renderFunctions) {
  const { renderCustomers, renderSales, renderPayments, renderDashboard, renderDashboardCharts, renderTable, renderLogs, populateCustomerDropdowns } = renderFunctions;
  if (activeTab === 'customers') {
    renderCustomers(cachedData.customers, activeTab);
  } else if (activeTab === 'sales') {
    renderSales(cachedData.sales, activeTab);
    populateCustomerDropdowns(cachedData.customers, activeTab);
  } else if (activeTab === 'payments') {
    renderPayments(cachedData.payments, activeTab);
    populateCustomerDropdowns(cachedData.customers, activeTab);
  } else if (activeTab === 'transactions') {
    renderTable('transaction-table', cachedData.transactions, activeTab);
    populateCustomerDropdowns(cachedData.customers, activeTab);
  } else if (activeTab === 'balances') {
    renderTable('balance-table', cachedData.balances, activeTab);
  } else if (activeTab === 'dashboard') {
    renderDashboard(cachedData.customers);
    renderDashboardCharts(cachedData.balances, cachedData.sales, cachedData.payments);
  } else if (activeTab === 'logs') {
    renderLogs(cachedData.logs);
  }
}

export async function deleteCustomer(name, loadData, renderFunctions) {
  log(`Deleting customer ${name}`);
  const table = document.getElementById('customer-table');
  if (table) table.classList.add('opacity-50', 'pointer-events-none');
  try {
    log(`Fetching sales for ${name} from ${API}/sales?customerName=${encodeURIComponent(name)}`);
    const salesResponse = await fetch(`${API}/sales?customerName=${encodeURIComponent(name)}`);
    const sales = await salesResponse.json();
    log(`Sales response: ${JSON.stringify(sales)}`);
    
    log(`Fetching payments for ${name} from ${API}/payments?customerName=${encodeURIComponent(name)}`);
    const paymentsResponse = await fetch(`${API}/payments?customerName=${encodeURIComponent(name)}`);
    const payments = await paymentsResponse.json();
    log(`Payments response: ${JSON.stringify(payments)}`);
    
    if (!salesResponse.ok || !paymentsResponse.ok) {
      throw new Error(`HTTP error: Sales ${salesResponse.status}, Payments ${paymentsResponse.status}`);
    }
    
    if (sales.length || payments.length) {
      throw new Error(`Cannot delete: Found ${sales.length} sales and ${payments.length} payments for ${name}. Delete them first.`);
    }
    
    const res = await fetch(`${API}/customers/${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    log(`Customer ${name} deleted successfully`);
    await loadData('customers', renderFunctions);
  } catch (e) {
    log(`Error deleting customer ${name}: ${e.message}`, 'error');
    throw e;
  } finally {
    if (table) table.classList.remove('opacity-50', 'pointer-events-none');
  }
}

export async function deleteSale(id, loadData, renderFunctions) {
  log(`Deleting sale ${id}`);
  const table = document.getElementById('sales-table');
  if (table) table.classList.add('opacity-50', 'pointer-events-none');
  try {
    const res = await fetch(`${API}/sales/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    log(`Sale ${id} deleted successfully`);
    await loadData('sales', renderFunctions);
  } catch (e) {
    log(`Error deleting sale ${id}: ${e.message}`, 'error');
    throw e;
  } finally {
    if (table) table.classList.remove('opacity-50', 'pointer-events-none');
  }
}

export async function deletePayment(id, loadData, renderFunctions) {
  log(`Deleting payment ${id}`);
  const table = document.getElementById('payment-table');
  if (table) table.classList.add('opacity-50', 'pointer-events-none');
  try {
    const res = await fetch(`${API}/payments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    log(`Payment ${id} deleted successfully`);
    await loadData('payments', renderFunctions);
  } catch (e) {
    log(`Error deleting payment ${id}: ${e.message}`, 'error');
    throw e;
  } finally {
    if (table) table.classList.remove('opacity-50', 'pointer-events-none');
  }
}

export async function clearLogs(loadData, renderFunctions) {
  log(`Clearing logs`);
  try {
    const res = await fetch(`${API}/logs`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    log(`Logs cleared successfully`);
    await loadData('logs', renderFunctions);
  } catch (e) {
    log(`Error clearing logs: ${e.message}`, 'error');
    throw e;
  }
}
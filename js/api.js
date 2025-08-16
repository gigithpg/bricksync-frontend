export const API_BASE_KEY = 'apiBaseUrl';
export const DEFAULT_API = 'http://192.168.1.125:3000';
export let API = localStorage.getItem(API_BASE_KEY) || DEFAULT_API;

export function log(message, level = 'log') {
  console[level](`[BrickSync ${new Date().toISOString()}] ${message}`);
}

export async function checkApiUrl() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  log(`Checking API URL. Is mobile: ${isMobile}, Current API: ${API}`);
  
  // Skip health check if API is cached and valid
  if (localStorage.getItem('apiValid') === API) {
    log(`Using cached API: ${API}`);
    return;
  }

  // Try default API (192.168.1.125:3000) first
  try {
    const response = await fetch(`${DEFAULT_API}/customers`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    if (response.ok) {
      if (API !== DEFAULT_API) {
        API = DEFAULT_API;
        localStorage.setItem(API_BASE_KEY, API);
        localStorage.setItem('apiValid', API);
        log(`API switched to ${API}`);
      }
      return;
    }
  } catch (e) {
    log(`Default API (${DEFAULT_API}) unreachable: ${e.message}`, 'warn');
  }

  // If on mobile, try localhost
  if (isMobile) {
    try {
      const response = await fetch('http://localhost:3000/customers', { method: 'GET', signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        if (API !== 'http://localhost:3000') {
          API = 'http://localhost:3000';
          localStorage.setItem(API_BASE_KEY, API);
          localStorage.setItem('apiValid', API);
          log(`API switched to localhost:3000`);
        }
        return;
      }
    } catch (e) {
      log(`Localhost API unreachable: ${e.message}`, 'error');
    }
  }
  log('No API reachable', 'error');
}

export async function loadData(activeTab, showToast, renderFunctions) {
  log(`Starting data load for tab: ${activeTab}`);
  try {
    await checkApiUrl();
    if (!localStorage.getItem('apiValid')) {
      throw new Error('No valid API available');
    }
    const { renderCustomers, renderSales, renderPayments, renderDashboard, renderDashboardCharts } = renderFunctions;

    // Fetch customers
    log('Fetching customers');
    const customers = await fetch(`${API}/customers`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      return r.json();
    });
    log(`Loaded ${customers.length} customers`);
    if (activeTab === 'customers') {
      renderCustomers(customers, activeTab);
    }
    if (activeTab === 'sales' || activeTab === 'payments' || activeTab === 'transactions') {
      renderFunctions.populateCustomerDropdowns(customers, activeTab);
    }
    if (activeTab === 'dashboard') {
      renderDashboard(customers);
    }

    // Fetch and render sales
    let sales = [];
    if (activeTab === 'sales' || activeTab === 'dashboard' || activeTab === 'transactions') {
      log('Fetching sales');
      sales = await fetch(`${API}/sales`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      });
      log(`Loaded ${sales.length} sales`);
      if (activeTab === 'sales') {
        renderSales(sales, activeTab);
      }
    }

    // Fetch and render payments
    let payments = [];
    if (activeTab === 'payments' || activeTab === 'dashboard' || activeTab === 'transactions') {
      log('Fetching payments');
      payments = await fetch(`${API}/payments`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      });
      log(`Loaded ${payments.length} payments`);
      if (activeTab === 'payments') {
        renderPayments(payments, activeTab);
      }
    }

    // Fetch and render transactions
    if (activeTab === 'transactions') {
      log('Fetching transactions');
      const transactions = await fetch(`${API}/transactions`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      });
      log(`Loaded ${transactions.length} transactions`);
      renderFunctions.renderTable('transaction-table', transactions, activeTab);
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
        renderDashboardCharts(balances, sales, payments);
      } else {
        renderFunctions.renderTable('balance-table', balances, activeTab);
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
      renderFunctions.renderLogs(logs);
    }
  } catch (e) {
    log(`Error loading data: ${e.message}`, 'error');
    showToast(`Error loading data: ${e.message}. Check API URL in Settings.`);
  }
}

export async function deleteCustomer(name, showToast, loadData) {
  log(`Deleting customer ${name}`);
  const table = document.getElementById('customer-table');
  if (table) table.classList.add('opacity-50', 'pointer-events-none');
  try {
    showToast('Checking for linked sales/payments...');
    const sales = await fetch(`${API}/sales?customerName=${encodeURIComponent(name)}`).then(r => r.json());
    const payments = await fetch(`${API}/payments?customerName=${encodeURIComponent(name)}`).then(r => r.json());
    if (sales.length || payments.length) {
      showToast(`Cannot delete: Found ${sales.length} sales and ${payments.length} payments. Delete them first.`);
      log(`Cannot delete customer ${name}: ${sales.length} sales, ${payments.length} payments`, 'error');
      return;
    }
    showToast('No linked transactions found. Deleting...');
    const res = await fetch(`${API}/customers/${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete customer');
    log(`Customer ${name} deleted successfully`);
    showToast('Customer deleted successfully');
    await loadData('customers');
  } catch (e) {
    log(`Error deleting customer ${name}: ${e.message}`, 'error');
    showToast(`Error: ${e.message}`);
  } finally {
    if (table) table.classList.remove('opacity-50', 'pointer-events-none');
  }
}

export async function deleteSale(id, showToast, loadData) {
  log(`Deleting sale ${id}`);
  const table = document.getElementById('sales-table');
  if (table) table.classList.add('opacity-50', 'pointer-events-none');
  try {
    const res = await fetch(`${API}/sales/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete sale');
    log(`Sale ${id} deleted successfully`);
    showToast('Sale deleted successfully');
    await loadData('sales');
  } catch (e) {
    log(`Error deleting sale ${id}: ${e.message}`, 'error');
    showToast(`Error: ${e.message}`);
  } finally {
    if (table) table.classList.remove('opacity-50', 'pointer-events-none');
  }
}

export async function deletePayment(id, showToast, loadData) {
  log(`Deleting payment ${id}`);
  const table = document.getElementById('payment-table');
  if (table) table.classList.add('opacity-50', 'pointer-events-none');
  try {
    const res = await fetch(`${API}/payments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete payment');
    log(`Payment ${id} deleted successfully`);
    showToast('Payment deleted successfully');
    await loadData('payments');
  } catch (e) {
    log(`Error deleting payment ${id}: ${e.message}`, 'error');
    showToast(`Error: ${e.message}`);
  } finally {
    if (table) table.classList.remove('opacity-50', 'pointer-events-none');
  }
}

export async function clearLogs(showToast, loadData) {
  log(`Clearing logs`);
  try {
    const res = await fetch(`${API}/logs`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to clear logs');
    log(`Logs cleared successfully`);
    showToast('Logs cleared successfully');
    await loadData('logs');
  } catch (e) {
    log(`Error clearing logs: ${e.message}`, 'error');
    showToast(`Error: ${e.message}`);
  }
}
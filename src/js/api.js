export const API_BASE_KEY = 'apiBase';
let logs = JSON.parse(localStorage.getItem('logs')) || [];

export function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  logs.push({ timestamp, message, type });
  localStorage.setItem('logs', JSON.stringify(logs));
}

export function logLayout(message) {
  log(message, 'layout');
}

export async function loadData(tab, renderFunctions, param = null) {
  const API = localStorage.getItem(API_BASE_KEY) || 'http://192.168.1.125:3000';
  const spinner = showLoadingSpinner();
  try {
    if (tab === 'customers') {
      const res = await fetch(`${API}/customers`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      renderFunctions.renderCustomers(data, renderFunctions);
    } else if (tab === 'sales') {
      const res = await fetch(`${API}/sales`);
      if (!res.ok) throw new Error('Failed to fetch sales');
      const data = await res.json();
      renderFunctions.renderSales(data, renderFunctions);
    } else if (tab === 'payments') {
      const res = await fetch(`${API}/payments`);
      if (!res.ok) throw new Error('Failed to fetch payments');
      const data = await res.json();
      renderFunctions.renderPayments(data, renderFunctions);
    } else if (tab === 'transactions') {
      const res = await fetch(`${API}/transactions`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      renderFunctions.renderTransactions(data);
    } else if (tab === 'balances') {
      const res = await fetch(`${API}/balances`);
      if (!res.ok) throw new Error('Failed to fetch balances');
      const data = await res.json();
      renderFunctions.renderBalances(data);
    } else if (tab === 'logs') {
      renderFunctions.renderLogs(logs);
    } else if (tab === 'dashboard') {
      const res = await fetch(`${API}/dashboard`);
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      const data = await res.json();
      renderFunctions.renderDashboard(data);
    } else if (tab === 'deleteCustomer') {
      const name = param;
      const salesResponse = await fetch(`${API}/sales?customerName=${encodeURIComponent(name)}`);
      const paymentsResponse = await fetch(`${API}/payments?customerName=${encodeURIComponent(name)}`);
      log(`Sales response: ${JSON.stringify(await salesResponse.json())}`);
      log(`Payments response: ${JSON.stringify(await paymentsResponse.json())}`);
      const sales = (await salesResponse.json()).filter(s => s['Customer Name'] === name);
      const payments = (await paymentsResponse.json()).filter(p => p['Customer Name'] === name);
      if (sales.length > 0 || payments.length > 0) {
        throw new Error('Cannot delete customer with existing sales or payments');
      }
      const res = await fetch(`${API}/customers/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete customer');
      showToast('Customer deleted successfully');
      await loadData('customers', renderFunctions);
    } else if (tab === 'deleteSale') {
      const id = param;
      const res = await fetch(`${API}/sales/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete sale');
      showToast('Sale deleted successfully');
      await loadData('sales', renderFunctions);
    } else if (tab === 'deletePayment') {
      const id = param;
      const res = await fetch(`${API}/payments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete payment');
      showToast('Payment deleted successfully');
      await loadData('payments', renderFunctions);
    } else if (tab === 'clearLogs') {
      logs = [];
      localStorage.setItem('logs', JSON.stringify(logs));
      showToast('Logs cleared successfully');
      await loadData('logs', renderFunctions);
    }
  } catch (e) {
    log(`Error loading ${tab}: ${e.message}`, 'error');
    showToast(`Error loading ${tab}: ${e.message}`);
  } finally {
    hideLoadingSpinner(spinner);
  }
}
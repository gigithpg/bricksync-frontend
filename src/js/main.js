import { loadData } from './api.js';
import { setupFormListeners, setupDeviceModalListener } from './forms.js';
import { renderCustomers, renderSales, renderPayments, renderTransactions, renderBalances, renderLogs, renderDashboard, showToast } from './ui.js';

const tabs = ['dashboard', 'customers', 'sales', 'payments', 'transactions', 'balances', 'logs', 'settings'];
const renderFunctions = { renderCustomers, renderSales, renderPayments, renderTransactions, renderBalances, renderLogs, renderDashboard };

export function loadTabContent(tab, renderFunctions) {
  const headerTitle = document.querySelector('h2');
  headerTitle.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
  const content = document.getElementById('content');
  content.innerHTML = document.getElementById(`${tab}-template`).innerHTML;
  loadData(tab, renderFunctions);
  setupFormListeners(tab, renderFunctions);
  if (tab === 'settings') setupDeviceModalListener(renderFunctions);
}

export function showDeleteModal(name, type, id, renderFunctions) {
  const modal = document.createElement('div');
  modal.className = 'tk-modal';
  modal.innerHTML = `
    <div class="tk-modal-content">
      <h2 class="text-lg font-semibold text-gray-900">Confirm Delete</h2>
      <p class="mt-2 text-gray-600">Are you sure you want to delete ${type} ${name}?</p>
      <div class="mt-4 flex justify-end space-x-2">
        <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300">Cancel</button>
        <button id="confirm-btn" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('cancel-btn').addEventListener('click', () => modal.remove());
  document.getElementById('confirm-btn').addEventListener('click', async () => {
    modal.remove();
    if (type === 'customer') await loadData('deleteCustomer', renderFunctions, name);
    else if (type === 'sale') await loadData('deleteSale', renderFunctions, id);
    else if (type === 'payment') await loadData('deletePayment', renderFunctions, id);
    else if (type === 'logs') await loadData('clearLogs', renderFunctions);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.getAttribute('data-tab');
      loadTabContent(tab, renderFunctions);
    });
  });
  const savedDeviceType = localStorage.getItem('device-type');
  if (!savedDeviceType) {
    document.getElementById('device-modal').classList.remove('hidden');
    setupDeviceModalListener(renderFunctions); // Add listener for initial modal
  } else {
    loadTabContent('dashboard', renderFunctions);
  }
});
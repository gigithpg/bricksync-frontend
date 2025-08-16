import { log, loadData, checkApiUrl, deleteCustomer, deleteSale, deletePayment, clearLogs } from './api.js';
import { logLayout, showToast, showLoadingSpinner, hideLoadingSpinner, renderTable, renderCustomers, renderSales, renderPayments, renderLogs, renderDashboard, renderDashboardCharts, populateCustomerDropdowns, toggleSidebar } from './ui.js';
import { setupFormListeners, setupDeviceModalListener, updateSaleAmount } from './forms.js';

const renderFunctions = { renderTable, renderCustomers, renderSales, renderPayments, renderLogs, renderDashboard, renderDashboardCharts, populateCustomerDropdowns };

async function loadTabContent(tab) {
  logLayout(`Attempting to load tab content: ${tab}`);
  localStorage.setItem('activeTab', tab);
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
    
    let flatpickrInstances = [];
    if (tab === 'sales' || tab === 'payments') {
      try {
        if (document.getElementById('sale-date')) {
          flatpickrInstances.push(flatpickr('#sale-date', { dateFormat: 'd/m/Y', closeOnSelect: true }));
        }
        if (document.getElementById('payment-date')) {
          flatpickrInstances.push(flatpickr('#payment-date', { dateFormat: 'd/m/Y', closeOnSelect: true }));
        }
        logLayout('Flatpickr initialized for ' + tab);
      } catch (e) {
        log(`Error initializing Flatpickr for ${tab}: ${e.message}`, 'error');
      }
    }
    if (tab === 'dashboard') {
      try {
        if (document.getElementById('sales-date-filter')) {
          flatpickrInstances.push(flatpickr('#sales-date-filter', { dateFormat: 'd/m/Y', closeOnSelect: true }));
        }
        logLayout('Flatpickr initialized for dashboard sales date filter');
      } catch (e) {
        log('Error initializing Flatpickr for dashboard: ' + e.message, 'error');
      }
    }
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.flatpickr-calendar')) {
        flatpickrInstances.filter(instance => instance && typeof instance.close === 'function').forEach(instance => instance.close());
      }
    }, { once: true });
    
    setupFormListeners(tab, renderFunctions);
    if (tab === 'logs') {
      const clearLogsButton = document.getElementById('clear-logs');
      if (clearLogsButton) {
        clearLogsButton.addEventListener('click', () => clearLogs(loadData));
        logLayout('Clear logs button listener added');
      } else {
        log('Clear logs button not found', 'error');
      }
    }
    showLoadingSpinner(tab);
    await loadData(tab, renderFunctions);
    hideLoadingSpinner(tab);
    logLayout(`Tab ${tab} fully initialized`);
    if (window.innerWidth < 768) {
      toggleSidebar(false);
    }
  } catch (e) {
    log(`Error loading tab content ${tab}: ${e.message}`, 'error');
    tabContent.innerHTML = `<p class="text-red-600 p-4">Error loading ${tab} content: ${e.message}. Please check Settings.</p>`;
    showToast(`Error loading ${tab}: ${e.message}. Please check Settings.`);
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
        if (window.innerWidth < 768) {
          toggleSidebar(false);
          logLayout('Sidebar closed on mobile tab click');
        }
        await loadTabContent(button.dataset.tab);
      });
    });
  } else {
    log('No tab buttons found', 'error');
  }
  const hamburger = document.getElementById('hamburger-menu');
  if (hamburger) {
    hamburger.addEventListener('click', () => toggleSidebar(true));
    logLayout('Hamburger menu listener added');
  } else {
    log('Hamburger menu not found', 'error');
  }
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger-menu');
    if (window.innerWidth < 768 && sidebar && !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
      toggleSidebar(false);
    }
  });

  // Add delete listeners
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-customer')) {
      deleteCustomer(e.target.dataset.name, loadData).then(() => showToast('Customer deleted successfully')).catch(e => showToast(e.message));
    } else if (e.target.classList.contains('delete-sale')) {
      deleteSale(e.target.dataset.id, loadData).then(() => showToast('Sale deleted successfully')).catch(e => showToast(e.message));
    } else if (e.target.classList.contains('delete-payment')) {
      deletePayment(e.target.dataset.id, loadData).then(() => showToast('Payment deleted successfully')).catch(e => showToast(e.message));
    }
  });

  // Add filter listeners
  document.addEventListener('change', (e) => {
    const target = e.target;
    if (target.id === 'sales-table-filter-customer' || target.id === 'payment-table-filter-customer') {
      const tableId = target.id.split('-filter-')[0];
      const data = JSON.parse(localStorage.getItem(`${tableId}-data`) || '[]');
      const filteredData = target.value ? data.filter(row => row['Customer Name'] === target.value) : data;
      renderTable(tableId, filteredData, target.id.includes('sales') ? 'sales' : 'payments');
    } else if (target.id === 'transaction-table-filter-customer' || target.id === 'transaction-table-filter-type') {
      const data = JSON.parse(localStorage.getItem('transaction-table-data') || '[]');
      const customerFilter = document.getElementById('transaction-table-filter-customer');
      const typeFilter = document.getElementById('transaction-table-filter-type');
      let filteredData = [...data];
      if (customerFilter.value) {
        filteredData = filteredData.filter(row => row['Customer Name'] === customerFilter.value);
      }
      if (typeFilter.value) {
        filteredData = filteredData.filter(row => row.Type === typeFilter.value);
      }
      renderTable('transaction-table', filteredData, 'transactions');
    }
  });

  logLayout('Event listeners setup complete');
}

document.addEventListener('DOMContentLoaded', async () => {
  logLayout('DOM content loaded');
  await setupEventListeners();
  const deviceType = localStorage.getItem('device-type');
  if (!deviceType) {
    document.getElementById('device-modal').classList.remove('hidden');
    setupDeviceModalListener(renderFunctions);
  } else {
    const activeTab = localStorage.getItem('activeTab') || 'dashboard';
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active', 'bg-indigo-600', 'text-white', 'md:bg-indigo-100', 'md:text-indigo-800');
    });
    const activeButton = document.querySelector(`.tab-button[data-tab="${activeTab}"]`);
    if (activeButton) {
      activeButton.classList.add('active', 'bg-indigo-600', 'text-white', 'md:bg-indigo-100', 'md:text-indigo-800');
    }
    await loadTabContent(activeTab);
  }
});
import { log, API_BASE_KEY, loadData } from './api.js';
import { showToast, showLoadingSpinner, hideLoadingSpinner } from './ui.js';

let API = localStorage.getItem(API_BASE_KEY) || 'http://192.168.1.125:3000';

export function updateSaleAmount() {
  const qty = parseFloat(document.getElementById('sale-quantity')?.value) || 0;
  const rate = parseFloat(document.getElementById('sale-rate')?.value) || 0;
  const rent = parseFloat(document.getElementById('sale-vehicle-rent')?.value) || 0;
  const amountInput = document.getElementById('sale-amount');
  if (amountInput) {
    amountInput.value = (qty * rate + rent).toFixed(2);
    log(`Updated sale amount: ${(qty * rate + rent).toFixed(2)}`); // Replaced logLayout with log
  } else {
    log('Sale amount input not found', 'error');
  }
}

export function setupFormListeners(tab, renderFunctions) {
  log(`Setting up form listeners for tab: ${tab}`); // Replaced logLayout with log
  if (tab === 'customers') {
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
      customerForm.reset();
      customerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = customerForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Adding...';
        customerForm.classList.add('opacity-50', 'pointer-events-none');
        const name = document.getElementById('customer-name')?.value.trim();
        log(`Submitting customer form: ${name}`);
        if (!name) {
          log('Customer name is empty', 'error');
          showToast('Customer Name is required');
          submitButton.disabled = false;
          submitButton.textContent = 'Add';
          customerForm.classList.remove('opacity-50', 'pointer-events-none');
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
          showToast('Customer added successfully');
          customerForm.reset();
          await loadData('customers', renderFunctions);
        } catch (e) {
          log(`Error adding customer: ${e.message}`, 'error');
          showToast(`Error: ${e.message}`);
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Add';
          customerForm.classList.remove('opacity-50', 'pointer-events-none');
        }
      });
      log('Customer form listener added'); // Replaced logLayout with log
    } else {
      log('Customer form not found', 'error');
    }
  }
  // ... (rest of the file remains unchanged, update other logLayout calls to log similarly)
  if (tab === 'settings') {
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = settingsForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        settingsForm.classList.add('opacity-50', 'pointer-events-none');
        const deviceType = settingsForm.querySelector('input[name="device-type"]:checked')?.value;
        log(`Submitting settings form: deviceType=${deviceType}`);
        if (!deviceType) {
          showToast('Please select a device type');
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          settingsForm.classList.remove('opacity-50', 'pointer-events-none');
          return;
        }
        try {
          const newApi = deviceType === 'mobile' ? 'http://localhost:3000' : 'http://192.168.1.125:3000';
          localStorage.setItem(API_BASE_KEY, newApi);
          localStorage.setItem('device-type', deviceType);
          API = newApi;
          const apiValid = await fetch(`${API}/customers`, { method: 'GET', signal: AbortSignal.timeout(5000) });
          if (!apiValid.ok) throw new Error('API unreachable');
          localStorage.setItem('apiValid', API);
          log(`Settings saved: deviceType=${deviceType}, API=${API}`);
          showToast('Settings saved successfully');
          settingsForm.reset();
          await loadData('settings', renderFunctions);
        } catch (e) {
          log(`Error saving settings: ${e.message}`, 'error');
          showToast(`Error: ${e.message}`);
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          settingsForm.classList.remove('opacity-50', 'pointer-events-none');
        }
      });
      log('Settings form listener added'); // Replaced logLayout with log
    } else {
      log('Settings form not found', 'error');
    }
  }
}

export function setupDeviceModalListener(renderFunctions) {
  const deviceForm = document.getElementById('device-form');
  if (deviceForm) {
    deviceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const deviceType = deviceForm.querySelector('input[name="device-type"]:checked')?.value;
      log(`Submitting device form: deviceType=${deviceType}`);
      if (!deviceType) {
        showToast('Please select a device type');
        return;
      }
      try {
        const newApi = deviceType === 'mobile' ? 'http://localhost:3000' : 'http://192.168.1.125:3000';
        localStorage.setItem(API_BASE_KEY, newApi);
        localStorage.setItem('device-type', deviceType);
        API = newApi;
        const apiValid = await fetch(`${API}/customers`, { method: 'GET', signal: AbortSignal.timeout(5000) });
        if (!apiValid.ok) throw new Error('API unreachable');
        localStorage.setItem('apiValid', API);
        log(`Device type saved: ${deviceType}, API=${API}`);
        document.getElementById('device-modal').classList.add('hidden');
        await loadData('dashboard', renderFunctions);
      } catch (e) {
        log(`Error setting device type: ${e.message}`, 'error');
        showToast(`Error: ${e.message}`);
      }
    });
    log('Device modal listener added'); // Replaced logLayout with log
  } else {
    log('Device form not found', 'error');
  }
}
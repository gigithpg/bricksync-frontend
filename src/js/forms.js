import { log, API_BASE_KEY, loadData } from './api.js';
import { logLayout, showToast, showLoadingSpinner, hideLoadingSpinner } from './ui.js';

let API = localStorage.getItem(API_BASE_KEY) || 'http://192.168.1.125:3000';

export function updateSaleAmount() {
  const qty = parseFloat(document.getElementById('sale-quantity')?.value) || 0;
  const rate = parseFloat(document.getElementById('sale-rate')?.value) || 0;
  const rent = parseFloat(document.getElementById('sale-vehicle-rent')?.value) || 0;
  const amountInput = document.getElementById('sale-amount');
  if (amountInput) {
    amountInput.value = (qty * rate + rent).toFixed(2);
    logLayout(`Updated sale amount: ${(qty * rate + rent).toFixed(2)}`);
  } else {
    log('Sale amount input not found', 'error');
  }
}

export function setupFormListeners(tab, renderFunctions) {
  logLayout(`Setting up form listeners for tab: ${tab}`);
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
      logLayout('Customer form listener added');
    } else {
      log('Customer form not found', 'error');
    }
  }

  if (tab === 'sales') {
    const salesForm = document.getElementById('sales-form');
    if (salesForm) {
      salesForm.reset();
      salesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = salesForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        salesForm.classList.add('opacity-50', 'pointer-events-none');
        const formData = new FormData(e.target);
        const saleData = {
          'Customer Name': formData.get('Customer Name'),
          Date: formData.get('Date'),
          Quantity: parseFloat(formData.get('Quantity')) || 0,
          Rate: parseFloat(formData.get('Rate')) || 0,
          'Vehicle Rent': parseFloat(formData.get('Vehicle Rent')) || 0,
          Amount: parseFloat(formData.get('Amount')) || 0,
          'Payment Method': formData.get('Payment Method') || '',
          'Payment Received': parseFloat(formData.get('Payment Received')) || 0,
          Remarks: formData.get('Remarks') || ''
        };
        log(`Submitting sale: ${JSON.stringify(saleData)}`);
        if (!saleData['Customer Name']) {
          showToast('Please select a customer');
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          salesForm.classList.remove('opacity-50', 'pointer-events-none');
          return;
        }
        if (!saleData.Date) {
          showToast('Please select a date');
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          salesForm.classList.remove('opacity-50', 'pointer-events-none');
          return;
        }
        if (isNaN(saleData.Quantity) || saleData.Quantity <= 0) {
          showToast('Quantity must be a positive number');
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          salesForm.classList.remove('opacity-50', 'pointer-events-none');
          return;
        }
        if (isNaN(saleData.Rate) || saleData.Rate <= 0) {
          showToast('Rate must be a positive number');
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          salesForm.classList.remove('opacity-50', 'pointer-events-none');
          return;
        }
        if (saleData['Payment Method'] && (isNaN(saleData['Payment Received']) || saleData['Payment Received'] < 0)) {
          showToast('Payment Received must be a non-negative number when a Payment Method is selected');
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          salesForm.classList.remove('opacity-50', 'pointer-events-none');
          return;
        }
        try {
          const res = await fetch(`${API}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
          });
          if (!res.ok) throw new Error((await res.json()).error || 'Failed to add sale');
          log(`Sale added successfully`);
          showToast('Sale added successfully');
          salesForm.reset();
          await loadData(tab, renderFunctions);
        } catch (e) {
          log(`Error adding sale: ${e.message}`, 'error');
          showToast(`Error: ${e.message}`);
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          salesForm.classList.remove('opacity-50', 'pointer-events-none');
        }
      });
      logLayout('Sales form listener added');
      const saleQty = document.getElementById('sale-quantity');
      const saleRate = document.getElementById('sale-rate');
      const saleRent = document.getElementById('sale-vehicle-rent');
      const saleMethod = document.getElementById('sale-payment-method');
      if (saleQty) {
        saleQty.addEventListener('input', updateSaleAmount);
        logLayout('Sale quantity listener added');
      } else {
        log('Sale quantity input not found', 'error');
      }
      if (saleRate) {
        saleRate.addEventListener('input', updateSaleAmount);
        logLayout('Sale rate listener added');
      } else {
        log('Sale rate input not found', 'error');
      }
      if (saleRent) {
        saleRent.addEventListener('input', updateSaleAmount);
        logLayout('Sale vehicle rent listener added');
      } else {
        log('Sale vehicle rent input not found', 'error');
      }
      if (saleMethod) {
        saleMethod.addEventListener('change', (e) => {
          const salePaid = document.getElementById('sale-payment-received');
          if (salePaid) {
            salePaid.required = e.target.value !== '';
            if (!e.target.value) salePaid.value = '';
            log(`Sale payment method changed: ${e.target.value}`);
          } else {
            log('Sale payment received input not found', 'error');
          }
        });
        logLayout('Sale payment method listener added');
      } else {
        log('Sale payment method input not found', 'error');
      }
    } else {
      log('Sales form not found', 'error');
    }
  }

  if (tab === 'payments') {
    const paymentsForm = document.getElementById('payment-form');
    if (paymentsForm) {
      paymentsForm.reset();
      paymentsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = paymentsForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        paymentsForm.classList.add('opacity-50', 'pointer-events-none');
        const formData = new FormData(e.target);
        const paymentData = {
          'Customer Name': formData.get('Customer Name'),
          Date: formData.get('Date'),
          'Payment Method': formData.get('Payment Method'),
          'Payment Received': parseFloat(formData.get('Payment Received')) || 0,
          Remarks: formData.get('Remarks') || ''
        };
        log(`Submitting payment: ${JSON.stringify(paymentData)}`);
        if (!paymentData['Customer Name']) {
          showToast('Please select a customer');
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          paymentsForm.classList.remove('opacity-50', 'pointer-events-none');
          return;
        }
        if (!paymentData.Date) {
          showToast('Please select a date');
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          paymentsForm.classList.remove('opacity-50', 'pointer-events-none');
          return;
        }
        if (!paymentData['Payment Method']) {
          showToast('Please select a payment method');
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          paymentsForm.classList.remove('opacity-50', 'pointer-events-none');
          return;
        }
        if (isNaN(paymentData['Payment Received']) || paymentData['Payment Received'] <= 0) {
          showToast('Payment Received must be a positive number');
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          paymentsForm.classList.remove('opacity-50', 'pointer-events-none');
          return;
        }
        try {
          const res = await fetch(`${API}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
          });
          if (!res.ok) throw new Error((await res.json()).error || 'Failed to add payment');
          log(`Payment added successfully`);
          showToast('Payment added successfully');
          paymentsForm.reset();
          await loadData(tab, renderFunctions);
        } catch (e) {
          log(`Error adding payment: ${e.message}`, 'error');
          showToast(`Error: ${e.message}`);
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Save';
          paymentsForm.classList.remove('opacity-50', 'pointer-events-none');
        }
      });
      logLayout('Payments form listener added');
    } else {
      log('Payments form not found', 'error');
    }
  }

  if (tab === 'settings') {
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.reset();
      const savedDeviceType = localStorage.getItem('device-type');
      if (savedDeviceType) {
        const radio = settingsForm.querySelector(`input[name="device-type"][value="${savedDeviceType}"]`);
        if (radio) radio.checked = true;
      }
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
      logLayout('Settings form listener added');
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
    logLayout('Device modal listener added');
  } else {
    log('Device form not found', 'error');
  }
}
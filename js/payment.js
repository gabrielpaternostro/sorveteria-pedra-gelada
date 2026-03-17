/**
 * payment.js — Payment processing: Pix, Debit, Credit
 */

function confirmPayment() {
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();

  if (!name) { showToast('Informe seu nome!', 'error'); return; }
  if (!phone) { showToast('Informe seu telefone!', 'error'); return; }

  const activeTab = document.querySelector('.method-tab.active');
  const method = activeTab ? activeTab.textContent.trim().toLowerCase().replace('é', 'e').replace('ó', 'o') : 'pix';
  const methodMap = { 'pix': 'pix', 'débito': 'debit', 'debito': 'debit', 'crédito': 'credit', 'credito': 'credit' };
  const paymentMethod = methodMap[method] || 'pix';

  if (!validatePaymentFields(paymentMethod)) return;

  // Create order
  const orderId = DB.newOrderId();
  const total = getCartTotal();

  const order = DB.insert('orders', {
    id: orderId,
    customer_name: name,
    customer_phone: phone,
    status: 'pending',
    total,
    payment_method: paymentMethod,
    created_at: new Date().toISOString()
  });

  // Insert order items
  cart.forEach(item => {
    DB.insert('order_items', {
      id: DB.newOrderId(),
      order_id: orderId,
      product_id: item.productId,
      product_name: item.name,
      qty: item.qty,
      unit_price: item.price
    });
  });

  // Record payment
  DB.insert('payments', {
    id: DB.newOrderId(),
    order_id: orderId,
    method: paymentMethod,
    amount: total,
    status: 'approved',
    created_at: new Date().toISOString()
  });

  // Clear cart and close modal
  cart = [];
  updateCartUI();
  closePayment();
  clearPaymentForm();

  // Show success
  showSuccessModal(orderId, name, paymentMethod);

  // Refresh orders board
  renderOrders();

  // Simulate order progression
  simulateOrderProgress(orderId, name);
}

function validatePaymentFields(method) {
  if (method === 'pix') return true;

  const prefix = method === 'debit' ? 'debit' : 'credit';
  const number = document.getElementById(prefix + 'Number').value.replace(/\s/g, '');
  const expiry = document.getElementById(prefix + 'Expiry').value;
  const cvv    = document.getElementById(prefix + 'CVV').value;
  const cname  = document.getElementById(prefix + 'Name').value.trim();

  if (number.length < 16) { showToast('Número do cartão inválido!', 'error'); return false; }
  if (expiry.length < 5)  { showToast('Validade inválida!', 'error'); return false; }
  if (cvv.length < 3)     { showToast('CVV inválido!', 'error'); return false; }
  if (!cname)             { showToast('Informe o nome no cartão!', 'error'); return false; }
  return true;
}

function clearPaymentForm() {
  ['customerName', 'customerPhone', 'debitNumber', 'debitExpiry', 'debitCVV',
   'debitName', 'creditNumber', 'creditExpiry', 'creditCVV', 'creditName'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  // Reset to PIX tab
  document.querySelectorAll('.method-tab').forEach((btn, i) => btn.classList.toggle('active', i === 0));
  document.getElementById('pixPanel').classList.remove('hidden');
  document.getElementById('debitPanel').classList.add('hidden');
  document.getElementById('creditPanel').classList.add('hidden');
}

// Simulate kitchen progression: pending → preparing → ready
function simulateOrderProgress(orderId, customerName) {
  // After 12s: start preparing
  setTimeout(() => {
    DB.update('orders', orderId, { status: 'preparing' });
    renderOrders();
    showToast(`Pedido #${orderId} em preparação!`, 'info');
  }, 12000);

  // After 45s: ready
  setTimeout(() => {
    DB.update('orders', orderId, { status: 'ready' });
    renderOrders();
    notifyOrderReady(orderId, customerName);
  }, 45000);
}

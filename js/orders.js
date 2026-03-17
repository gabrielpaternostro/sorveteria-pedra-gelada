/**
 * orders.js — Order management board (Kanban-style)
 */

// ===================== RENDER ORDERS BOARD =====================
function renderOrders() {
  const statuses = ['pending', 'preparing', 'ready', 'delivered'];
  const listIds  = ['listPending', 'listPreparing', 'listReady', 'listDelivered'];
  const countIds = ['countPending', 'countPreparing', 'countReady', 'countDelivered'];

  statuses.forEach((status, i) => {
    const orders = DB.select('orders', o => o.status === status)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    document.getElementById(countIds[i]).textContent = orders.length;

    const list = document.getElementById(listIds[i]);
    if (orders.length === 0) {
      list.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:.8rem;padding:20px">Nenhum pedido</div>`;
    } else {
      list.innerHTML = orders.map(order => renderOrderCard(order)).join('');
    }
  });
}

function renderOrderCard(order) {
  const items = DB.select('order_items', i => i.order_id === order.id);
  const itemsSummary = items.map(i => `${i.qty}x ${i.product_name}`).join(', ');
  const paymentLabel = { pix: 'PIX', debit: 'Débito', credit: 'Crédito' }[order.payment_method] || order.payment_method;
  const timeAgo = getTimeAgo(order.created_at);

  let actions = '';
  if (isAdmin) {
    if (order.status === 'pending') {
      actions = `<button class="btn-status blue" onclick="updateOrderStatus('${order.id}', 'preparing')">Iniciar Preparo</button>`;
    } else if (order.status === 'preparing') {
      actions = `<button class="btn-status green" onclick="updateOrderStatus('${order.id}', 'ready')">Marcar Pronto</button>`;
    } else if (order.status === 'ready') {
      actions = `<button class="btn-status gray" onclick="updateOrderStatus('${order.id}', 'delivered')">Entregar</button>`;
    }
  }

  return `
    <div class="order-card ${order.status}" id="order-${order.id}">
      <div class="order-id">#${order.id} · ${paymentLabel}</div>
      <div class="order-name">${order.customer_name}</div>
      <div class="order-items-list">${itemsSummary}</div>
      <div class="order-total-label">R$ ${formatMoney(order.total)}</div>
      <div class="order-time">${timeAgo}</div>
      ${actions ? `<div class="order-actions">${actions}</div>` : ''}
    </div>
  `;
}

function updateOrderStatus(orderId, newStatus) {
  const order = DB.findById('orders', orderId);
  if (!order) return;

  DB.update('orders', orderId, { status: newStatus });
  renderOrders();

  const labels = { preparing: 'Em preparo', ready: 'Pronto!', delivered: 'Entregue' };
  showToast(`Pedido #${orderId}: ${labels[newStatus]}`, 'success');

  if (newStatus === 'ready') {
    notifyOrderReady(orderId, order.customer_name);
  }
}

function getTimeAgo(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora mesmo';
  if (mins < 60) return `${mins} min atrás`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h atrás`;
}

// Poll for new "ready" orders and show banner notification
let lastNotifiedOrders = new Set();

function checkOrderNotifications() {
  const readyOrders = DB.select('orders', o => o.status === 'ready');
  readyOrders.forEach(order => {
    if (!lastNotifiedOrders.has(order.id)) {
      lastNotifiedOrders.add(order.id);
      showNotificationBanner(`Pedido #${order.id} de ${order.customer_name} está PRONTO! 🍦`);
    }
  });
  renderOrders();
}

// Re-render on page load
document.addEventListener('DOMContentLoaded', renderOrders);

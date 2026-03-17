/**
 * app.js — Core application: products rendering, cart management, ratings
 */

// ===================== STATE =====================
let cart = [];
let currentRating = 0;
let isAdmin = false;

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  renderReviews();
  requestNotificationPermission();
  // Poll for order status changes every 8 seconds
  setInterval(checkOrderNotifications, 8000);
});

// ===================== PRODUCTS =====================
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const products = DB.select('products', p => p.available);

  grid.innerHTML = products.map(p => `
    <div class="product-card" onclick="quickAdd(${p.id})">
      <div class="product-img-placeholder" style="background:${p.bg}">
        <span>${p.emoji}</span>
      </div>
      <div class="product-body">
        <p class="product-name">${p.name}</p>
        <p class="product-desc">${p.description}</p>
        <div class="product-footer">
          <span class="product-price">R$ ${formatMoney(p.price)}</span>
          <button class="btn-add" onclick="event.stopPropagation(); addToCart(${p.id})" title="Adicionar ao carrinho">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ===================== CART =====================
function addToCart(productId) {
  const product = DB.findById('products', productId);
  if (!product) return;

  const existing = cart.find(i => i.productId === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ productId, name: product.name, price: product.price, emoji: product.emoji, qty: 1 });
  }

  updateCartUI();
  showToast(`${product.emoji} ${product.name} adicionado!`, 'success');
  animateCartBadge();
}

function quickAdd(productId) {
  addToCart(productId);
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.productId !== productId);
  updateCartUI();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.productId === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(productId);
  else updateCartUI();
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = count;

  const itemsEl = document.getElementById('cartItems');
  if (cart.length === 0) {
    itemsEl.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted)">
      <div style="font-size:3rem">🛒</div>
      <p style="margin-top:10px">Seu carrinho está vazio</p>
    </div>`;
  } else {
    itemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <span class="cart-item-emoji">${item.emoji}</span>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">R$ ${formatMoney(item.price * item.qty)}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${item.productId}, -1)">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.productId}, 1)">+</button>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('cartTotal').textContent = `R$ ${formatMoney(getCartTotal())}`;
}

function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  drawer.classList.toggle('hidden');
  overlay.classList.toggle('hidden');
  updateCartUI();
}

function animateCartBadge() {
  const badge = document.getElementById('cartCount');
  badge.style.transform = 'scale(1.4)';
  setTimeout(() => badge.style.transform = 'scale(1)', 250);
}

// ===================== PAYMENT MODAL =====================
function openPayment() {
  if (cart.length === 0) { showToast('Adicione itens ao carrinho!', 'error'); return; }
  updateOrderSummary();
  document.getElementById('paymentModal').classList.remove('hidden');
  document.getElementById('cartDrawer').classList.add('hidden');
  document.getElementById('cartOverlay').classList.add('hidden');
}

function closePayment() {
  document.getElementById('paymentModal').classList.add('hidden');
}

function updateOrderSummary() {
  const el = document.getElementById('orderSummaryItems');
  el.innerHTML = cart.map(i => `
    <div class="summary-item">
      <span>${i.emoji} ${i.name} x${i.qty}</span>
      <span>R$ ${formatMoney(i.price * i.qty)}</span>
    </div>
  `).join('');
  document.getElementById('summaryTotal').textContent = `R$ ${formatMoney(getCartTotal())}`;
}

function selectMethod(method, btn) {
  document.querySelectorAll('.method-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['pixPanel', 'debitPanel', 'creditPanel'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(method + 'Panel').classList.remove('hidden');
}

function copyPix() {
  const key = 'sorveteriapedragelada@pix.com';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(key).then(() => {
      showToast('Chave PIX copiada!', 'success');
    }).catch(() => _fallbackCopy(key));
  } else {
    _fallbackCopy(key);
  }
}

function _fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast('Chave PIX copiada!', 'success');
  } catch (e) {
    showToast('Copie manualmente: ' + text, 'info');
  }
  document.body.removeChild(ta);
}

function formatCard(input) {
  let v = input.value.replace(/\D/g, '');
  v = v.replace(/(\d{4})/g, '$1 ').trim();
  input.value = v;
}

function formatExpiry(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length >= 3) v = v.substr(0, 2) + '/' + v.substr(2, 2);
  input.value = v;
}

// ===================== RATING =====================
function setRating(value) {
  currentRating = value;
  const labels = ['', 'Muito Ruim 😞', 'Ruim 😕', 'Regular 😐', 'Bom 😊', 'Excelente! 😍'];
  document.getElementById('ratingLabel').textContent = labels[value];
  document.querySelectorAll('.star').forEach((s, i) => {
    s.classList.toggle('active', i < value);
  });
}

document.querySelectorAll('.star').forEach(star => {
  star.addEventListener('mouseenter', function() {
    const val = parseInt(this.dataset.value);
    document.querySelectorAll('.star').forEach((s, i) => {
      s.classList.toggle('hover', i < val);
    });
  });
  star.addEventListener('mouseleave', () => {
    document.querySelectorAll('.star').forEach(s => s.classList.remove('hover'));
  });
});

function submitRating() {
  if (currentRating === 0) { showToast('Selecione uma nota!', 'error'); return; }
  const name = document.getElementById('ratingName').value.trim() || 'Anônimo';
  const comment = document.getElementById('ratingComment').value.trim();

  DB.insert('ratings', {
    id: DB.newOrderId(),
    name,
    rating: currentRating,
    comment,
    created_at: new Date().toISOString()
  });

  showToast('Obrigado pela sua avaliação!', 'success');
  document.getElementById('ratingName').value = '';
  document.getElementById('ratingComment').value = '';
  currentRating = 0;
  document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
  document.getElementById('ratingLabel').textContent = 'Selecione uma nota';
  renderReviews();
}

function renderReviews() {
  const container = document.getElementById('reviewsContainer');
  const ratings = DB.select('ratings').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
  container.innerHTML = ratings.map(r => `
    <div class="review-card">
      <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <p class="review-text">${r.comment || 'Sem comentário.'}</p>
      <span class="review-author">— ${r.name} · ${formatDate(r.created_at)}</span>
    </div>
  `).join('');
}

// ===================== ADMIN TOGGLE =====================
function toggleAdmin() {
  isAdmin = !isAdmin;
  document.getElementById('adminToggleLabel').textContent = isAdmin ? 'Sair do Modo Operador' : 'Entrar como Operador';
  document.getElementById('adminBadge').classList.toggle('hidden', !isAdmin);
  renderOrders();
}

// ===================== NAV TOGGLE =====================
function toggleNav() {
  document.querySelector('.nav-links').classList.toggle('open');
}

// ===================== UTILS =====================
function formatMoney(value) {
  return value.toFixed(2).replace('.', ',');
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function closeNotification() {
  document.getElementById('notificationBanner').classList.add('hidden');
}

function closeSuccess() {
  document.getElementById('successModal').classList.add('hidden');
}

function showSuccessModal(orderId, customerName, method) {
  const methods = { pix: 'PIX', debit: 'Cartão de Débito', credit: 'Cartão de Crédito' };
  document.getElementById('successOrderNumber').textContent = `#${orderId}`;
  document.getElementById('successMessage').textContent =
    `Olá, ${customerName}! Seu pedido foi recebido com sucesso via ${methods[method]}.`;
  document.getElementById('successModal').classList.remove('hidden');
}

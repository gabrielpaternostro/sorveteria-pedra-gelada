/**
 * notifications.js — Browser notifications + banner alerts
 */

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function notifyOrderReady(orderId, customerName) {
  showNotificationBanner(`Pedido #${orderId} de ${customerName} está PRONTO para retirada! 🍦`);

  if ('Notification' in window && Notification.permission === 'granted') {
    const notif = new Notification('Sorveteria Pedra Gelada 🍦', {
      body: `Pedido #${orderId} de ${customerName} está PRONTO!`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍦</text></svg>',
      tag: orderId,
      requireInteraction: true
    });

    notif.onclick = () => {
      window.focus();
      document.getElementById('pedidos').scrollIntoView({ behavior: 'smooth' });
      notif.close();
    };
  }

  // Play a subtle audio beep if AudioContext is available
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // Audio not available
  }
}

function showNotificationBanner(message) {
  const banner = document.getElementById('notificationBanner');
  const text = document.getElementById('notificationText');
  text.textContent = message;
  banner.classList.remove('hidden');

  // Auto-hide after 8 seconds
  clearTimeout(window._bannerTimer);
  window._bannerTimer = setTimeout(() => {
    banner.classList.add('hidden');
  }, 8000);
}

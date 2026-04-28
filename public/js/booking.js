/**
 * Booking Module — Payment tabs, seat locking, and booking submission
 */

document.addEventListener('DOMContentLoaded', () => {
  initPaymentTabs();
  initBookButton();
  initPromoCode();
});

/** Switch between payment method tabs */
function initPaymentTabs() {
  const tabs = document.querySelectorAll('.payment-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // Show/hide forms
      const method = tab.dataset.method;
      document.getElementById('cardForm').style.display = method === 'card' ? 'block' : 'none';
      document.getElementById('upiForm').style.display = method === 'upi' ? 'block' : 'none';
      document.getElementById('netbankingForm').style.display = method === 'netbanking' ? 'block' : 'none';
    });
  });
}

/** Handle promo code application */
function initPromoCode() {
  const btn = document.getElementById('applyPromo');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const code = document.getElementById('promoCode').value.trim();
    if (!code) { showToast('Enter a promo code', 'warning'); return; }
    showToast('Promo code will be applied at checkout', 'info');
  });
}

/** Main book button handler */
function initBookButton() {
  const btn = document.getElementById('bookBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!getToken()) {
      showToast('Please login to book tickets', 'warning');
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }

    if (selectedSeats.length === 0) {
      showToast('Please select at least one seat', 'warning');
      return;
    }

    const loading = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');

    try {
      btn.disabled = true;
      if (loading) loading.classList.remove('hidden');
      if (loadingText) loadingText.textContent = 'Locking your seats...';

      // Step 1: Lock seats
      await api.post('/seats/lock', {
        concertId: concertData.concert_id,
        seatLabels: selectedSeats
      });

      if (loadingText) loadingText.textContent = 'Processing payment...';

      // Step 2: Process payment (simulated)
      const activeTab = document.querySelector('.payment-tab.active');
      const paymentMethod = activeTab ? activeTab.dataset.method : 'card';
      await api.post('/payments/process', {
        method: paymentMethod,
        amount: calculateTotal()
      });

      if (loadingText) loadingText.textContent = 'Confirming your booking...';

      // Step 3: Create booking
      const promoCode = document.getElementById('promoCode')?.value.trim() || null;
      const result = await api.post('/bookings', {
        concertId: concertData.concert_id,
        seatLabels: selectedSeats,
        paymentMethod: paymentMethod,
        promoCode: promoCode
      });

      // Step 4: Redirect to confirmation
      localStorage.setItem('lastBooking', JSON.stringify(result.booking));
      showToast('Booking confirmed! 🎉', 'success');

      setTimeout(() => {
        window.location.href = `/booking.html?id=${result.booking.booking_id}`;
      }, 800);

    } catch (error) {
      showToast(error.message, 'error');
      if (loading) loading.classList.add('hidden');
      btn.disabled = false;
      // Try to unlock seats on failure
      try { await api.post('/seats/unlock', { concertId: concertData.concert_id }); } catch(_) {}
    }
  });
}

/** Calculate total price from selected seats */
function calculateTotal() {
  let total = 0;
  selectedSeats.forEach(label => {
    const seat = allSeats.find(s => s.seat_label === label);
    if (seat && seat.seat_type === 'vip' && concertData.vip_price) {
      total += parseFloat(concertData.vip_price);
    } else {
      total += parseFloat(concertData.price);
    }
  });
  return total;
}

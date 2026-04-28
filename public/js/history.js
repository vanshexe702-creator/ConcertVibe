/**
 * History Module — Booking history listing, cancel, and download
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('bookingList')) return;
  if (!getToken()) { window.location.href = '/login.html?redirect=/history.html'; return; }
  loadBookingHistory();
  initCancelModal();
});

let cancelBookingId = null;

async function loadBookingHistory() {
  const list = document.getElementById('bookingList');
  const empty = document.getElementById('emptyState');

  try {
    const data = await api.get('/bookings/history');
    const bookings = data.bookings;

    if (bookings.length === 0) {
      list.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');
    list.innerHTML = bookings.map(b => renderBookingItem(b)).join('');
  } catch (error) {
    showToast('Failed to load booking history', 'error');
  }
}

function renderBookingItem(b) {
  const seats = typeof b.seats === 'string' ? JSON.parse(b.seats) : b.seats;
  const dateStr = formatDate(b.date);
  const isCancelled = b.booking_status === 'cancelled';
  const statusBadge = isCancelled
    ? '<span class="badge badge-error">Cancelled</span>'
    : '<span class="badge badge-success">Confirmed</span>';

  // Check if cancellation is allowed (24h before concert)
  const concertDate = new Date(b.date);
  const canCancel = !isCancelled && (concertDate - new Date()) / 3600000 > 24;

  return `
    <div class="booking-item animate-fade-in">
      <div class="booking-item-image">
        <div style="width:100%;height:100%;background:linear-gradient(135deg,var(--bg-elevated),var(--primary-600));display:flex;align-items:center;justify-content:center;font-size:2rem;">🎵</div>
      </div>
      <div class="booking-item-info">
        <h4>${b.title}</h4>
        <p style="color:var(--primary-300);font-size:0.9rem;">🎤 ${b.artist}</p>
        <div class="meta">
          <span>📅 ${dateStr}</span>
          <span>📍 ${b.venue}, ${b.city}</span>
          <span>🪑 ${seats.join(', ')}</span>
          <span>🎫 ${b.booking_id}</span>
        </div>
        <div style="margin-top:var(--space-sm)">${statusBadge}</div>
      </div>
      <div class="booking-item-actions">
        <div class="amount">${formatCurrency(b.total_amount)}</div>
        <a href="/booking.html?id=${b.booking_id}" class="btn btn-secondary btn-sm">View Ticket</a>
        ${canCancel ? `<button class="btn btn-danger btn-sm" onclick="openCancelModal('${b.booking_id}')">Cancel</button>` : ''}
      </div>
    </div>`;
}

function openCancelModal(bookingId) {
  cancelBookingId = bookingId;
  document.getElementById('cancelBookingId').textContent = 'Booking: ' + bookingId;
  document.getElementById('cancelModal').classList.remove('hidden');
}

function initCancelModal() {
  const modal = document.getElementById('cancelModal');
  const closeBtn = document.getElementById('cancelModalClose');
  const cancelBtn = document.getElementById('cancelModalCancel');
  const confirmBtn = document.getElementById('cancelModalConfirm');

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!cancelBookingId) return;
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Cancelling...';
      try {
        await api.post(`/bookings/${cancelBookingId}/cancel`, {});
        showToast('Booking cancelled successfully', 'success');
        modal.classList.add('hidden');
        loadBookingHistory();
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Yes, Cancel';
      }
    });
  }
}

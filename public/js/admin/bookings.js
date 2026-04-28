/**
 * Admin Bookings JS — View all user bookings
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!getAdminToken()) { window.location.href = '/admin/login.html'; return; }
  initAdminLogout();
  loadAllBookings();
});

function initAdminLogout() {
  const btn = document.getElementById('adminLogout');
  if (btn) btn.addEventListener('click', () => { localStorage.removeItem('adminToken'); localStorage.removeItem('admin'); window.location.href = '/admin/login.html'; });
}

async function loadAllBookings() {
  try {
    const data = await api.get('/admin/bookings', true);
    const tbody = document.getElementById('bookingsBody');
    if (!tbody) return;

    if (data.bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);">No bookings yet</td></tr>';
      return;
    }

    tbody.innerHTML = data.bookings.map(b => {
      const seats = typeof b.seats === 'string' ? JSON.parse(b.seats) : b.seats;
      const statusBadge = b.booking_status === 'cancelled' ? 'badge-error' : 'badge-success';
      const paymentBadge = b.payment_status === 'completed' ? 'badge-success' : b.payment_status === 'refunded' ? 'badge-warning' : 'badge-error';
      return `<tr>
        <td><strong>${b.booking_id}</strong></td>
        <td>${b.user_name}<br><small style="color:var(--text-muted)">${b.user_email}</small></td>
        <td>${b.title}<br><small style="color:var(--text-muted)">${b.artist}</small></td>
        <td>${seats.join(', ')}</td>
        <td>$${parseFloat(b.total_amount).toFixed(2)}</td>
        <td><span class="badge ${paymentBadge}">${b.payment_status}</span></td>
        <td><span class="badge ${statusBadge}">${b.booking_status}</span></td>
        <td>${new Date(b.booking_date).toLocaleDateString()}</td>
      </tr>`;
    }).join('');
  } catch (error) {
    showToast('Failed to load bookings', 'error');
  }
}

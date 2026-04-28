/**
 * Admin Dashboard JS — Stats and Chart.js charts
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!getAdminToken()) { window.location.href = '/admin/login.html'; return; }
  initAdminLogout();
  loadDashboard();
  document.getElementById('dashboardDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});

function initAdminLogout() {
  const btn = document.getElementById('adminLogout');
  if (btn) btn.addEventListener('click', () => {
    localStorage.removeItem('adminToken'); localStorage.removeItem('admin');
    window.location.href = '/admin/login.html';
  });
}

async function loadDashboard() {
  try {
    const data = await api.get('/admin/dashboard', true);
    const s = data.stats;

    document.getElementById('statRevenue').textContent = '$' + parseFloat(s.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 });
    document.getElementById('statBookings').textContent = s.totalBookings;
    document.getElementById('statTickets').textContent = s.totalTickets;
    document.getElementById('statUsers').textContent = s.totalUsers;
    document.getElementById('statConcerts').textContent = s.totalConcerts;

    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx && data.monthlyRevenue.length > 0) {
      new Chart(revenueCtx, {
        type: 'bar',
        data: {
          labels: data.monthlyRevenue.map(m => m.month).reverse(),
          datasets: [{
            label: 'Revenue ($)',
            data: data.monthlyRevenue.map(m => parseFloat(m.revenue)).reverse(),
            backgroundColor: 'rgba(147, 51, 234, 0.6)',
            borderColor: 'rgba(147, 51, 234, 1)',
            borderWidth: 1, borderRadius: 6
          }]
        },
        options: {
          responsive: true, plugins: { legend: { labels: { color: '#a5a3c4' } } },
          scales: { x: { ticks: { color: '#6b6993' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#6b6993' }, grid: { color: 'rgba(255,255,255,0.05)' } } }
        }
      });
    }

    // Popular Concerts Chart
    const popularCtx = document.getElementById('popularChart');
    if (popularCtx && data.popularConcerts.length > 0) {
      const colors = ['#9333ea', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'];
      new Chart(popularCtx, {
        type: 'doughnut',
        data: {
          labels: data.popularConcerts.map(c => c.title),
          datasets: [{
            data: data.popularConcerts.map(c => c.booking_count),
            backgroundColor: colors, borderColor: '#222233', borderWidth: 3
          }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#a5a3c4', padding: 15 } } } }
      });
    }
  } catch (error) {
    showToast('Failed to load dashboard: ' + error.message, 'error');
  }
}

/**
 * Admin Seats JS — Visual seat grid editor for blocking/unblocking
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!getAdminToken()) { window.location.href = '/admin/login.html'; return; }
  initAdminLogout();
  loadConcertSelector();
});

function initAdminLogout() {
  const btn = document.getElementById('adminLogout');
  if (btn) btn.addEventListener('click', () => { localStorage.removeItem('adminToken'); localStorage.removeItem('admin'); window.location.href = '/admin/login.html'; });
}

let adminSelectedSeats = [];
let adminAllSeats = [];
let currentConcertId = null;

async function loadConcertSelector() {
  try {
    const data = await api.get('/admin/concerts', true);
    const select = document.getElementById('concertSelect');
    data.concerts.forEach(c => {
      select.innerHTML += `<option value="${c.concert_id}">${c.title} — ${c.artist} (${c.available_seats}/${c.total_seats} seats)</option>`;
    });
    select.addEventListener('change', (e) => {
      currentConcertId = e.target.value;
      if (currentConcertId) {
        document.getElementById('seatSection').style.display = 'block';
        loadAdminSeats(currentConcertId);
      } else {
        document.getElementById('seatSection').style.display = 'none';
      }
    });

    // Block/Unblock buttons
    document.getElementById('blockBtn').addEventListener('click', () => manageSeatAction('block'));
    document.getElementById('unblockBtn').addEventListener('click', () => manageSeatAction('unblock'));
  } catch (error) {
    showToast('Failed to load concerts', 'error');
  }
}

async function loadAdminSeats(concertId) {
  try {
    const data = await api.get(`/seats/${concertId}`);
    adminAllSeats = data.seats;
    adminSelectedSeats = [];
    renderAdminSeatMap();
    updateSeatInfo();
  } catch (error) {
    showToast('Failed to load seats', 'error');
  }
}

function renderAdminSeatMap() {
  const grid = document.getElementById('adminSeatGrid');
  if (!grid) return;

  const rows = {};
  adminAllSeats.forEach(s => { if (!rows[s.seat_row]) rows[s.seat_row] = []; rows[s.seat_row].push(s); });

  let html = '';
  Object.keys(rows).sort().forEach(row => {
    const rowSeats = rows[row].sort((a, b) => a.seat_number - b.seat_number);
    html += `<div class="seat-row"><div class="seat-row-label">${row}</div>`;
    rowSeats.forEach(seat => {
      const isSelected = adminSelectedSeats.includes(seat.seat_label);
      let cls = seat.status;
      if (isSelected) cls = 'selected';
      const canSelect = seat.status === 'available' || seat.status === 'blocked' || isSelected;
      const onclick = canSelect ? `onclick="toggleAdminSeat('${seat.seat_label}')"` : '';
      html += `<div class="seat ${cls}" ${onclick} title="${seat.seat_label} — ${seat.status}">${seat.seat_number}</div>`;
    });
    html += `</div>`;
  });
  grid.innerHTML = html;
}

function toggleAdminSeat(label) {
  const idx = adminSelectedSeats.indexOf(label);
  if (idx >= 0) adminSelectedSeats.splice(idx, 1);
  else adminSelectedSeats.push(label);
  renderAdminSeatMap();
  updateSeatInfo();
}

function updateSeatInfo() {
  const info = document.getElementById('seatInfo');
  const available = adminAllSeats.filter(s => s.status === 'available').length;
  const booked = adminAllSeats.filter(s => s.status === 'booked').length;
  const blocked = adminAllSeats.filter(s => s.status === 'blocked').length;
  info.textContent = `Available: ${available} | Booked: ${booked} | Blocked: ${blocked} | Selected: ${adminSelectedSeats.length}`;
}

async function manageSeatAction(action) {
  if (adminSelectedSeats.length === 0) { showToast('Select seats first', 'warning'); return; }
  try {
    await api.post('/admin/seats/block', { concertId: parseInt(currentConcertId), seatLabels: adminSelectedSeats, action }, true);
    showToast(`Seats ${action}ed successfully!`, 'success');
    adminSelectedSeats = [];
    loadAdminSeats(currentConcertId);
  } catch (error) { showToast(error.message, 'error'); }
}

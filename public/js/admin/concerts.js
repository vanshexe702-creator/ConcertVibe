/**
 * Admin Concerts JS — CRUD operations for concerts
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!getAdminToken()) { window.location.href = '/admin/login.html'; return; }
  initAdminLogout();
  loadAdminConcerts();
  initConcertModal();
});

function initAdminLogout() {
  const btn = document.getElementById('adminLogout');
  if (btn) btn.addEventListener('click', () => { localStorage.removeItem('adminToken'); localStorage.removeItem('admin'); window.location.href = '/admin/login.html'; });
}

async function loadAdminConcerts() {
  try {
    const data = await api.get('/admin/concerts', true);
    const tbody = document.getElementById('concertsBody');
    if (!tbody) return;

    tbody.innerHTML = data.concerts.map(c => {
      const statusColors = { upcoming: 'badge-info', ongoing: 'badge-success', completed: 'badge-purple', cancelled: 'badge-error' };
      return `<tr>
        <td><strong>${c.title}</strong></td>
        <td>${c.artist}</td>
        <td>${c.venue}, ${c.city}</td>
        <td>${formatDate(c.date)}</td>
        <td>$${parseFloat(c.price).toFixed(2)}</td>
        <td>${c.available_seats}/${c.total_seats}</td>
        <td><span class="badge ${statusColors[c.status] || 'badge-info'}">${c.status}</span></td>
        <td class="actions">
          <button class="btn btn-secondary btn-sm" onclick="editConcert(${c.concert_id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteConcert(${c.concert_id})">🗑️</button>
        </td>
      </tr>`;
    }).join('');
  } catch (error) {
    showToast('Failed to load concerts', 'error');
  }
}

let allAdminConcerts = [];

async function editConcert(id) {
  try {
    const data = await api.get(`/concerts/${id}`);
    const c = data.concert;
    document.getElementById('modalTitle').textContent = 'Edit Concert';
    document.getElementById('editConcertId').value = c.concert_id;
    document.getElementById('cTitle').value = c.title;
    document.getElementById('cArtist').value = c.artist;
    document.getElementById('cVenue').value = c.venue;
    document.getElementById('cCity').value = c.city;
    document.getElementById('cDate').value = c.date.split('T')[0];
    document.getElementById('cTime').value = c.time;
    document.getElementById('cPrice').value = c.price;
    document.getElementById('cVipPrice').value = c.vip_price || '';
    document.getElementById('cSeats').value = c.total_seats;
    document.getElementById('cCategory').value = c.category || '';
    document.getElementById('cDesc').value = c.description || '';
    document.getElementById('cImage').value = c.image_url || '';
    document.getElementById('cStatus').value = c.status;
    document.getElementById('statusGroup').style.display = 'block';
    document.getElementById('concertModal').classList.remove('hidden');
  } catch (error) { showToast('Failed to load concert', 'error'); }
}

async function deleteConcert(id) {
  if (!confirm('Are you sure you want to delete this concert?')) return;
  try {
    await api.delete(`/admin/concerts/${id}`, true);
    showToast('Concert deleted', 'success');
    loadAdminConcerts();
  } catch (error) { showToast(error.message, 'error'); }
}

function initConcertModal() {
  const modal = document.getElementById('concertModal');
  const addBtn = document.getElementById('addConcertBtn');
  const closeBtn = document.getElementById('modalClose');
  const cancelBtn = document.getElementById('modalCancelBtn');
  const saveBtn = document.getElementById('saveConcertBtn');

  const closeModal = () => { modal.classList.add('hidden'); document.getElementById('concertForm').reset(); document.getElementById('editConcertId').value = ''; document.getElementById('statusGroup').style.display = 'none'; };

  addBtn.addEventListener('click', () => { document.getElementById('modalTitle').textContent = 'Add Concert'; closeModal(); modal.classList.remove('hidden'); });
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  saveBtn.addEventListener('click', async () => {
    const id = document.getElementById('editConcertId').value;
    const body = {
      title: document.getElementById('cTitle').value,
      artist: document.getElementById('cArtist').value,
      venue: document.getElementById('cVenue').value,
      city: document.getElementById('cCity').value,
      date: document.getElementById('cDate').value,
      time: document.getElementById('cTime').value,
      price: parseFloat(document.getElementById('cPrice').value),
      vip_price: parseFloat(document.getElementById('cVipPrice').value) || null,
      total_seats: parseInt(document.getElementById('cSeats').value),
      category: document.getElementById('cCategory').value || 'General',
      description: document.getElementById('cDesc').value,
      image_url: document.getElementById('cImage').value,
      status: document.getElementById('cStatus').value || 'upcoming'
    };

    if (!body.title || !body.artist || !body.venue || !body.date || !body.time || !body.price) {
      showToast('Please fill in all required fields', 'warning'); return;
    }

    saveBtn.disabled = true;
    try {
      if (id) { await api.put(`/admin/concerts/${id}`, body, true); showToast('Concert updated!', 'success'); }
      else { await api.post('/admin/concerts', body, true); showToast('Concert added!', 'success'); }
      closeModal();
      loadAdminConcerts();
    } catch (error) { showToast(error.message, 'error'); }
    finally { saveBtn.disabled = false; }
  });
}

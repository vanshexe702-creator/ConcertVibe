/**
 * Seat Map Module — Interactive seat selection for concert booking
 * Renders seat grid, handles click selection, and communicates with booking sidebar.
 */

let concertData = null;
let selectedSeats = [];
let allSeats = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('seatGrid')) return;
  const urlParams = new URLSearchParams(window.location.search);
  const concertId = urlParams.get('id');
  if (!concertId) { window.location.href = '/'; return; }
  loadConcertDetail(concertId);
});

/** Load concert info and seats */
async function loadConcertDetail(concertId) {
  try {
    const data = await api.get(`/concerts/${concertId}`);
    concertData = data.concert;
    renderConcertInfo(concertData);
    await loadSeats(concertId);

    // Start countdown
    const el = document.getElementById('concertCountdown');
    if (el) createCountdown(concertData.date + 'T' + concertData.time, el);
  } catch (error) {
    showToast('Failed to load concert details', 'error');
  }
}

/** Render concert info into the page */
function renderConcertInfo(c) {
  document.title = `${c.title} — ConcertVibe`;
  const heroBg = document.getElementById('heroBg');
  if (heroBg) heroBg.style.backgroundImage = `linear-gradient(135deg, hsl(270,60%,15%), hsl(330,60%,10%))`;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('concertTitle', c.title);
  setEl('concertArtist', '🎤 ' + c.artist);
  setEl('concertCategory', c.category || 'General');
  setEl('concertVenue', c.venue);
  setEl('concertCity', c.city);
  setEl('concertDate', formatDate(c.date));
  setEl('concertTime', formatTime(c.time));
  setEl('concertPrice', formatCurrency(c.price));
  setEl('concertVipPrice', c.vip_price ? formatCurrency(c.vip_price) : 'N/A');
  setEl('concertDescription', c.description || 'An amazing live concert experience awaits you!');
}

/** Load seats for the concert */
async function loadSeats(concertId) {
  try {
    const data = await api.get(`/seats/${concertId}`);
    allSeats = data.seats;
    renderSeatMap(allSeats);

    // Show login prompt if not logged in
    const user = getUser();
    if (!user) {
      const prompt = document.getElementById('loginPrompt');
      if (prompt) prompt.classList.remove('hidden');
    }
  } catch (error) {
    showToast('Failed to load seat map', 'error');
  }
}

/** Render the seat grid */
function renderSeatMap(seats) {
  const grid = document.getElementById('seatGrid');
  if (!grid) return;

  // Group seats by row
  const rows = {};
  seats.forEach(s => {
    if (!rows[s.seat_row]) rows[s.seat_row] = [];
    rows[s.seat_row].push(s);
  });

  let html = '';
  const sortedRows = Object.keys(rows).sort();

  sortedRows.forEach(row => {
    const rowSeats = rows[row].sort((a, b) => a.seat_number - b.seat_number);
    html += `<div class="seat-row">`;
    html += `<div class="seat-row-label">${row}</div>`;

    rowSeats.forEach(seat => {
      const isSelected = selectedSeats.includes(seat.seat_label);
      let statusClass = seat.status;
      if (isSelected) statusClass = 'selected';

      const typeClass = seat.seat_type === 'vip' ? ' vip' : '';
      const clickable = seat.status === 'available' || isSelected;
      const onclick = clickable ? `onclick="toggleSeat('${seat.seat_label}')"` : '';
      const title = `${seat.seat_label} — ${seat.seat_type.toUpperCase()} — ${seat.status}`;

      html += `<div class="seat ${statusClass}${typeClass}" ${onclick} title="${title}" data-label="${seat.seat_label}">${seat.seat_number}</div>`;
    });

    html += `</div>`;
  });

  grid.innerHTML = html;
}

/** Toggle seat selection */
function toggleSeat(label) {
  const user = getUser();
  if (!user) {
    showToast('Please login to select seats', 'warning');
    return;
  }

  const idx = selectedSeats.indexOf(label);
  if (idx >= 0) {
    selectedSeats.splice(idx, 1);
  } else {
    if (selectedSeats.length >= 10) {
      showToast('Maximum 10 seats per booking', 'warning');
      return;
    }
    selectedSeats.push(label);
  }

  // Re-render seat map with updated selections
  renderSeatMap(allSeats);
  updateBookingSummary();
}

/** Update the booking sidebar summary */
function updateBookingSummary() {
  const noSeatsMsg = document.getElementById('noSeatsMsg');
  const selectedList = document.getElementById('selectedSeatsList');
  const seatTags = document.getElementById('seatTags');
  const summaryRows = document.getElementById('summaryRows');
  const paymentSection = document.getElementById('paymentSection');
  const promoSection = document.getElementById('promoSection');
  const bookBtn = document.getElementById('bookBtn');

  if (selectedSeats.length === 0) {
    if (noSeatsMsg) noSeatsMsg.style.display = 'block';
    if (selectedList) selectedList.classList.add('hidden');
    if (paymentSection) paymentSection.style.display = 'none';
    if (promoSection) promoSection.style.display = 'none';
    if (bookBtn) { bookBtn.disabled = true; bookBtn.textContent = 'Select seats to continue'; }
    return;
  }

  if (noSeatsMsg) noSeatsMsg.style.display = 'none';
  if (selectedList) selectedList.classList.remove('hidden');
  if (paymentSection) paymentSection.style.display = 'block';
  if (promoSection) promoSection.style.display = 'block';

  // Render seat tags
  if (seatTags) {
    seatTags.innerHTML = selectedSeats.map(s => {
      const seat = allSeats.find(x => x.seat_label === s);
      const isVip = seat && seat.seat_type === 'vip';
      return `<span class="badge ${isVip ? 'badge-warning' : 'badge-purple'}">${s}${isVip ? ' ★' : ''}</span>`;
    }).join('');
  }

  // Calculate prices
  let regularCount = 0, vipCount = 0, regularTotal = 0, vipTotal = 0;
  selectedSeats.forEach(label => {
    const seat = allSeats.find(s => s.seat_label === label);
    if (seat && seat.seat_type === 'vip' && concertData.vip_price) {
      vipCount++;
      vipTotal += parseFloat(concertData.vip_price);
    } else {
      regularCount++;
      regularTotal += parseFloat(concertData.price);
    }
  });

  const total = regularTotal + vipTotal;

  if (summaryRows) {
    let html = '';
    if (regularCount > 0) html += `<div class="summary-row"><span>Regular × ${regularCount}</span><span>${formatCurrency(regularTotal)}</span></div>`;
    if (vipCount > 0) html += `<div class="summary-row"><span>VIP × ${vipCount}</span><span>${formatCurrency(vipTotal)}</span></div>`;
    html += `<div class="summary-row total"><span>Total</span><span>${formatCurrency(total)}</span></div>`;
    summaryRows.innerHTML = html;
  }

  if (bookBtn) { bookBtn.disabled = false; bookBtn.textContent = `🎫 Book ${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''} — ${formatCurrency(total)}`; }
}

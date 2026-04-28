/**
 * Concerts Module — Landing page concert listing, search, and filtering
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('concertGrid')) return;
  loadConcerts();
  loadFilters();
  initSearch();
  initHeroParticles();
});

let allConcerts = [];
let searchTimeout = null;

/** Load and render concerts */
async function loadConcerts() {
  const grid = document.getElementById('concertGrid');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('concertCount');

  // Build query from filters
  const params = new URLSearchParams();
  const search = document.getElementById('searchInput')?.value.trim();
  const city = document.getElementById('filterCity')?.value;
  const category = document.getElementById('filterCategory')?.value;
  const sort = document.getElementById('filterSort')?.value;

  if (search) params.set('search', search);
  if (city) params.set('city', city);
  if (category) params.set('category', category);
  if (sort) params.set('sort', sort);

  try {
    const data = await api.get(`/concerts?${params.toString()}`);
    allConcerts = data.concerts;
    if (count) count.textContent = `${data.total} events found`;

    if (allConcerts.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');
    grid.innerHTML = allConcerts.map((c, i) => renderConcertCard(c, i)).join('');
  } catch (error) {
    showToast('Failed to load concerts', 'error');
    grid.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><h3>Failed to load</h3><p>Please make sure the server is running and try again.</p></div>';
  }
}

/** Render a single concert card */
function renderConcertCard(concert, index) {
  const dateStr = formatDate(concert.date);
  const timeStr = formatTime(concert.time);
  const seatsLeft = concert.available_seats;
  const seatsClass = seatsLeft <= 10 ? (seatsLeft === 0 ? 'sold-out' : 'low') : '';
  const seatsText = seatsLeft === 0 ? 'SOLD OUT' : `${seatsLeft} seats left`;
  const countdown = createCountdownShort(concert.date);
  const delay = Math.min(index, 5);

  const imgSrc = concert.image_url || '/assets/default-concert.jpg';
  const imgFallback = `style="background:linear-gradient(135deg, hsl(${(index * 45) % 360}, 70%, 20%), hsl(${(index * 45 + 60) % 360}, 70%, 15%));display:flex;align-items:center;justify-content:center;font-size:3rem;"`;

  return `
    <div class="card concert-card animate-fade-in-up delay-${delay}" onclick="window.location.href='/concert.html?id=${concert.concert_id}'">
      <div class="card-image" ${imgFallback}>
        <span style="position:relative;z-index:1;">🎵</span>
        <div class="card-badge">${concert.category || 'General'}</div>
        <div class="countdown-badge">⏱️ ${countdown}</div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${concert.title}</h3>
        <p class="card-artist">🎤 ${concert.artist}</p>
        <div class="card-meta">
          <span>📍 ${concert.venue}</span>
          <span>🏙️ ${concert.city}</span>
          <span>📅 ${dateStr}</span>
          <span>🕐 ${timeStr}</span>
        </div>
        <div class="card-footer">
          <div class="card-price">${formatCurrency(concert.price)} <small>/ ticket</small></div>
          <div class="card-seats ${seatsClass}">${seatsText}</div>
        </div>
      </div>
    </div>`;
}

/** Load filter dropdowns */
async function loadFilters() {
  try {
    const [citiesData, categoriesData] = await Promise.all([
      api.get('/concerts/cities'),
      api.get('/concerts/categories')
    ]);

    const citySelect = document.getElementById('filterCity');
    const catSelect = document.getElementById('filterCategory');

    if (citySelect) {
      citiesData.cities.forEach(c => { citySelect.innerHTML += `<option value="${c}">${c}</option>`; });
    }
    if (catSelect) {
      categoriesData.categories.forEach(c => { catSelect.innerHTML += `<option value="${c}">${c}</option>`; });
    }
  } catch (error) {
    console.log('Filters failed to load:', error.message);
  }
}

/** Initialize search and filter event listeners */
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(loadConcerts, 400); // Debounce
    });
  }

  ['filterCity', 'filterCategory', 'filterSort'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', loadConcerts);
  });
}

/** Generate animated particles for hero background */
function initHeroParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const span = document.createElement('span');
    span.style.left = Math.random() * 100 + '%';
    span.style.top = Math.random() * 100 + '%';
    span.style.animationDelay = Math.random() * 6 + 's';
    span.style.animationDuration = (4 + Math.random() * 4) + 's';
    span.style.opacity = 0.1 + Math.random() * 0.3;
    span.style.width = span.style.height = (2 + Math.random() * 3) + 'px';
    container.appendChild(span);
  }
}

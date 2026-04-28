/**
 * API Module — Centralized fetch wrapper with JWT auth headers
 * All API calls go through this module for consistent error handling.
 */

const API_BASE = '/api';

/** Get stored auth token */
function getToken() { return localStorage.getItem('token'); }
function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function getAdminToken() { return localStorage.getItem('adminToken'); }

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g. '/concerts')
 * @param {object} options - fetch options
 * @param {boolean} isAdmin - use admin token
 */
async function apiRequest(endpoint, options = {}, isAdmin = false) {
  const token = isAdmin ? getAdminToken() : getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      // Handle auth errors
      if (response.status === 401) {
        if (isAdmin) { localStorage.removeItem('adminToken'); window.location.href = '/admin/login.html'; }
        else { localStorage.removeItem('token'); localStorage.removeItem('user'); }
      }
      throw new Error(data.error || 'Request failed');
    }
    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') throw new Error('Network error. Please check your connection.');
    throw error;
  }
}

/** Convenience methods */
const api = {
  get:    (endpoint, isAdmin) => apiRequest(endpoint, { method: 'GET' }, isAdmin),
  post:   (endpoint, body, isAdmin) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }, isAdmin),
  put:    (endpoint, body, isAdmin) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }, isAdmin),
  delete: (endpoint, isAdmin) => apiRequest(endpoint, { method: 'DELETE' }, isAdmin),
};

/** Show toast notification */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4000);
}

/** Format date string */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

/** Format time string */
function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

/** Format currency */
function formatCurrency(amount) {
  return '$' + parseFloat(amount).toFixed(2);
}

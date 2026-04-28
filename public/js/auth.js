/**
 * Auth Module — Login, Register, Session management
 * Handles form submissions, token storage, and UI state.
 */

document.addEventListener('DOMContentLoaded', () => {
  initAuthUI();
  initLoginForm();
  initRegisterForm();
  initNavbar();
});

/** Update navbar based on login state */
function initAuthUI() {
  const user = getUser();
  const token = getToken();
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  const navHistory = document.getElementById('navHistory');

  if (user && token) {
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) { userMenu.classList.remove('hidden'); userMenu.style.display = 'block'; }
    const userName = document.getElementById('userName');
    if (userName) userName.textContent = user.name;
    if (navHistory) navHistory.classList.remove('hidden');

    // User menu dropdown toggle
    const btn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdown');
    if (btn && dropdown) {
      btn.addEventListener('click', () => dropdown.classList.toggle('hidden'));
      document.addEventListener('click', (e) => { if (!btn.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.add('hidden'); });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast('Logged out successfully', 'success');
        setTimeout(() => window.location.href = '/', 500);
      });
    }
  } else {
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) { userMenu.classList.add('hidden'); userMenu.style.display = 'none'; }
  }
}

/** Login form handler */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  // Redirect if already logged in
  if (getToken()) { window.location.href = '/'; return; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) { showToast('Please fill in all fields', 'warning'); return; }

    btn.disabled = true; btn.textContent = 'Signing in...';
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Welcome back, ' + data.user.name + '!', 'success');
      setTimeout(() => {
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        window.location.href = redirect || '/';
      }, 500);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  });
}

/** Register form handler */
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  if (getToken()) { window.location.href = '/'; return; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('registerBtn');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password) { showToast('Please fill in all required fields', 'warning'); return; }
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }
    if (password !== confirmPassword) { showToast('Passwords do not match', 'warning'); return; }

    btn.disabled = true; btn.textContent = 'Creating account...';
    try {
      const data = await api.post('/auth/register', { name, email, password, phone });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Account created! Welcome, ' + data.user.name + '!', 'success');
      setTimeout(() => window.location.href = '/', 500);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Create Account';
    }
  });
}

/** Navbar scroll effect and mobile toggle */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }
}

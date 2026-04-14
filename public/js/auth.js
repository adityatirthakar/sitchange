// ========== Auth Helpers ==========
const API = '';

function getToken() {
  return localStorage.getItem('sitchange_token');
}

function getUser() {
  const u = localStorage.getItem('sitchange_user');
  return u ? JSON.parse(u) : null;
}

function saveAuth(token, user) {
  localStorage.setItem('sitchange_token', token);
  localStorage.setItem('sitchange_user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('sitchange_token');
  localStorage.removeItem('sitchange_user');
  window.location.href = 'auth.html';
}

function updateNav() {
  const user = getUser();
  const authNavItem = document.getElementById('authNavItem');
  if (authNavItem) {
    if (user) {
      authNavItem.innerHTML = `<a href="#" onclick="logout()" class="nav-btn" style="background: var(--gradient-warm)">Logout (${user.name})</a>`;
    } else {
      authNavItem.innerHTML = `<a href="auth.html" class="nav-btn">Login</a>`;
    }
  }
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = 'auth.html';
    return false;
  }
  return true;
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

// ========== Toggle Forms ==========
function toggleForm(form) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (form === 'register') {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  } else {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  }
}

// ========== Login ==========
document.getElementById('loginFormEl')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('loginError');
  errorEl.style.display = 'none';

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const btn = document.getElementById('loginBtn');
  btn.innerHTML = '<span class="spinner"></span> Signing in...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    saveAuth(data.token, data.user);
    window.location.href = 'index.html';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
    btn.innerHTML = 'Sign In';
    btn.disabled = false;
  }
});

// ========== Register ==========
document.getElementById('registerFormEl')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('registerError');
  errorEl.style.display = 'none';

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  const btn = document.getElementById('registerBtn');
  btn.innerHTML = '<span class="spinner"></span> Creating account...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    saveAuth(data.token, data.user);
    window.location.href = 'index.html';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
    btn.innerHTML = 'Create Account';
    btn.disabled = false;
  }
});

// Redirect if already logged in
if (getToken()) {
  window.location.href = 'index.html';
}

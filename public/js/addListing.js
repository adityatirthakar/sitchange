// ========== Auth Helpers ==========
const API = '';

function getToken() {
  return localStorage.getItem('sitchange_token');
}

function getUser() {
  const u = localStorage.getItem('sitchange_user');
  return u ? JSON.parse(u) : null;
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

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ========== Require Auth ==========
if (!getToken()) {
  window.location.href = 'auth.html';
}
updateNav();

// ========== Add Listing Form ==========
document.getElementById('addListingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const errorEl = document.getElementById('formError');
  const successEl = document.getElementById('formSuccess');
  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  const data = {
    ticket_type: document.getElementById('ticketType').value,
    source: document.getElementById('source').value.trim(),
    destination: document.getElementById('destination').value.trim(),
    date: document.getElementById('date').value,
    seat_details: document.getElementById('seatDetails').value.trim(),
    description: document.getElementById('description').value.trim()
  };

  if (!data.ticket_type) {
    errorEl.textContent = 'Please select a ticket type.';
    errorEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.innerHTML = '<span class="spinner"></span> Publishing...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create listing');

    successEl.textContent = 'Listing published successfully! Redirecting...';
    successEl.style.display = 'block';
    document.getElementById('addListingForm').reset();

    setTimeout(() => {
      window.location.href = 'my-listings.html';
    }, 1500);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
    btn.innerHTML = 'Publish Listing';
    btn.disabled = false;
  }
});

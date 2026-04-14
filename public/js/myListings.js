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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ========== Require Auth ==========
if (!getToken()) {
  window.location.href = 'auth.html';
}
updateNav();

// ========== Load My Listings ==========
const typeIcons = {
  Train: '🚆', Bus: '🚌', Flight: '✈️',
  Movie: '🎬', Concert: '🎵', Hotel: '🏨'
};

async function loadMyListings() {
  const table = document.getElementById('listingsTable');
  const tbody = document.getElementById('listingsTableBody');
  const emptyState = document.getElementById('emptyState');

  try {
    const res = await fetch(`${API}/api/listings/mine`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    const listings = await res.json();

    if (!listings.length) {
      emptyState.style.display = 'block';
      table.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    table.style.display = 'table';
    tbody.innerHTML = '';

    listings.forEach(listing => {
      const icon = typeIcons[listing.ticket_type] || '🎫';
      const route = [listing.source, listing.destination].filter(Boolean).join(' → ') || '—';
      const tr = document.createElement('tr');
      tr.id = `my-listing-${listing.id}`;
      tr.innerHTML = `
        <td>${icon} ${listing.ticket_type}</td>
        <td>${route}</td>
        <td>${formatDate(listing.date)}</td>
        <td>${listing.seat_details || '—'}</td>
        <td>
          <a href="chat.html?listingId=${listing.id}&sellerId=${listing.user_id}" class="btn btn-secondary btn-sm">
            💬 Chat
          </a>
          <button class="btn btn-danger btn-sm" onclick="deleteListing(${listing.id})" id="deleteBtn-${listing.id}" style="margin-left:0.5rem">
            Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Failed to load listings:', err);
    showToast('Failed to load your listings', 'error');
  }
}

// ========== Delete Listing ==========
async function deleteListing(id) {
  if (!confirm('Are you sure you want to delete this listing?')) return;

  try {
    const res = await fetch(`${API}/api/listings/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete');

    showToast('Listing deleted successfully');
    loadMyListings();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========== Init ==========
loadMyListings();

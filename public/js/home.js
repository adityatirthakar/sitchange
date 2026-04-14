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

// ========== Badge Helper ==========
const typeIcons = {
  Train: '🚆', Bus: '🚌', Flight: '✈️',
  Movie: '🎬', Concert: '🎵', Hotel: '🏨'
};

function getBadgeClass(type) {
  return `badge-${type.toLowerCase()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ========== Load Listings ==========
async function loadListings() {
  const grid = document.getElementById('listingsGrid');
  const emptyState = document.getElementById('listingsEmpty');
  const user = getUser();

  try {
    const res = await fetch(`${API}/api/listings`);
    const listings = await res.json();

    if (!listings.length) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = '';

    listings.forEach(listing => {
      const card = document.createElement('div');
      card.className = 'card';
      card.id = `listing-card-${listing.id}`;

      const icon = typeIcons[listing.ticket_type] || '🎫';
      const badgeClass = getBadgeClass(listing.ticket_type);
      const route = listing.source && listing.destination
        ? `<div class="card-route">
            <span class="from">${listing.source}</span>
            <span class="arrow">→</span>
            <span class="to">${listing.destination}</span>
           </div>`
        : (listing.source ? `<div class="card-route"><span class="from">${listing.source}</span></div>` : '');

      const chatBtn = (user && user.id !== listing.user_id)
        ? `<a href="chat.html?listingId=${listing.id}&sellerId=${listing.user_id}" class="btn btn-chat btn-sm">💬 Chat with Seller</a>`
        : (user && user.id === listing.user_id)
          ? `<span class="btn btn-secondary btn-sm" style="cursor:default;opacity:0.6">Your Listing</span>`
          : `<a href="auth.html" class="btn btn-chat btn-sm">💬 Chat with Seller</a>`;

      card.innerHTML = `
        <span class="card-badge ${badgeClass}">${icon} ${listing.ticket_type}</span>
        ${route}
        <div class="card-meta">
          <span>📅 ${formatDate(listing.date)}</span>
          ${listing.seat_details ? `<span>💺 ${listing.seat_details}</span>` : ''}
        </div>
        ${listing.description ? `<div class="card-desc">${listing.description}</div>` : ''}
        <div class="card-footer">
          <div class="card-seller">by <strong>${listing.seller_name}</strong></div>
          ${chatBtn}
        </div>
      `;

      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load listings:', err);
    grid.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><h3>Failed to load listings</h3><p>Please check your connection and try again.</p></div>';
  }
}

// ========== Init ==========
updateNav();
loadListings();

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

// ========== Require Auth ==========
if (!getToken()) {
  window.location.href = 'auth.html';
}
updateNav();

// ========== Parse URL Params ==========
const params = new URLSearchParams(window.location.search);
const listingId = params.get('listingId');
const sellerId = params.get('sellerId');

if (!listingId || !sellerId) {
  document.getElementById('chatMessages').innerHTML =
    '<div class="empty-state"><div class="icon">⚠️</div><h3>Invalid chat link</h3><p>Please open a chat from a listing page.</p></div>';
}

const user = getUser();
const token = getToken();

// ========== Socket.IO Connection ==========
const socket = io({
  auth: { token }
});

socket.on('connect', () => {
  console.log('Connected to chat server');
  socket.emit('joinRoom', { listingId: parseInt(listingId) });
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});

// ========== Load Chat Header ==========
async function loadChatInfo() {
  try {
    const res = await fetch(`${API}/api/listings`);
    const listings = await res.json();
    const listing = listings.find(l => l.id === parseInt(listingId));

    if (listing) {
      const typeIcons = { Train: '🚆', Bus: '🚌', Flight: '✈️', Movie: '🎬', Concert: '🎵', Hotel: '🏨' };
      const icon = typeIcons[listing.ticket_type] || '🎫';
      const route = [listing.source, listing.destination].filter(Boolean).join(' → ');

      document.getElementById('chatTitle').textContent = `${icon} ${listing.ticket_type} — ${route || 'Chat'}`;
      document.getElementById('chatMeta').textContent = `Chatting with ${listing.seller_name} • ${listing.seat_details || ''}`;
    }
  } catch (err) {
    console.error('Failed to load chat info:', err);
  }
}

// ========== Load Previous Messages ==========
async function loadMessages() {
  const container = document.getElementById('chatMessages');

  try {
    const res = await fetch(`${API}/api/messages/${listingId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const messages = await res.json();
    container.innerHTML = '';

    if (!messages.length) {
      container.innerHTML = '<div class="empty-state" style="padding:2rem"><div class="icon">💬</div><h3>Start the conversation</h3><p>Send a message to begin chatting!</p></div>';
      return;
    }

    messages.forEach(msg => appendMessage(msg));
    scrollToBottom();
  } catch (err) {
    console.error('Failed to load messages:', err);
  }
}

// ========== Append Message to UI ==========
function appendMessage(msg) {
  const container = document.getElementById('chatMessages');

  // Remove empty state if present
  const emptyState = container.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  const div = document.createElement('div');
  const isSent = msg.sender_id === user.id;
  div.className = `message ${isSent ? 'message-sent' : 'message-received'}`;

  const time = new Date(msg.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  div.innerHTML = `
    ${!isSent ? `<div class="message-sender">${msg.sender_name}</div>` : ''}
    <div>${msg.message}</div>
    <div class="message-time">${time}</div>
  `;

  container.appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  const container = document.getElementById('chatMessages');
  container.scrollTop = container.scrollHeight;
}

// ========== Receive Messages ==========
socket.on('receiveMessage', (msg) => {
  appendMessage(msg);
});

// ========== Send Message ==========
function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  socket.emit('sendMessage', {
    listingId: parseInt(listingId),
    receiverId: parseInt(sellerId),
    message
  });

  input.value = '';
  input.focus();
}

document.getElementById('sendBtn')?.addEventListener('click', sendMessage);
document.getElementById('chatInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// ========== Init ==========
if (listingId && sellerId) {
  loadChatInfo();
  loadMessages();
}

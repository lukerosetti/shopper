const MOCK_MODE = localStorage.getItem('shopperMockMode') === 'true';

function getToken() {
  return localStorage.getItem('shopperToken');
}

function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

const MOCK_RESPONSES = [
  `Great choice! Let me ask a few questions to find the perfect match:

- What's the occasion? (casual, work, going out?)
- Any fit preference? (slim, regular, oversized?)
- What's your budget range?`,

  `Perfect, let me search for some options for you!

Here's what I found:

[PRODUCT]
name: Classic Cotton Crew Neck T-Shirt - Black
price: $24.99
store: Uniqlo
url: https://www.uniqlo.com/us/en/products/E466440-000
image: https://image.uniqlo.com/UQ/ST3/us/imagesgoods/466440/item/goods_09_466440.jpg
description: Premium supima cotton crew neck with a clean, modern fit.
[/PRODUCT]

[PRODUCT]
name: Slim Fit Stretch Oxford Shirt - Blue
price: $39.90
store: H&M
url: https://www2.hm.com/en_us/productpage.0985940003.html
image: https://lp2.hm.com/hmgoepprod?set=quality%5B79%5D&source=/0985940003.jpg
description: Tailored stretch oxford with a slim silhouette perfect for smart-casual looks.
[/PRODUCT]

[PRODUCT]
name: Men's Heavyweight Pocket Tee
price: $34.00
store: Everlane
url: https://www.everlane.com/products/mens-premium-weight-pocket-tee-black
image: https://media.everlane.com/image/upload/c_fill,w_600/i/mens-premium-weight-pocket-tee-black.jpg
description: Structured heavyweight cotton with a relaxed pocket detail — built to last.
[/PRODUCT]

Want me to refine the search or look for something different?`,
];

let mockIndex = 0;

function getMockResponse() {
  const response = MOCK_RESPONSES[Math.min(mockIndex, MOCK_RESPONSES.length - 1)];
  mockIndex++;
  return response;
}

export function isMockMode() {
  return MOCK_MODE;
}

export function toggleMockMode() {
  const current = localStorage.getItem('shopperMockMode') === 'true';
  localStorage.setItem('shopperMockMode', !current ? 'true' : 'false');
  window.location.reload();
}

// Auth
export async function login(pin) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) throw new Error('Invalid PIN');
  const data = await res.json();
  return data.token;
}

export async function validateSession() {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/auth', {
      headers: { ...authHeaders() },
    });
    const data = await res.json();
    return data.valid;
  } catch {
    return false;
  }
}

// Chat
export async function sendMessage(messages) {
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 800));
    return getMockResponse();
  }

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) throw new Error('Failed to get response');
  const data = await res.json();
  return data.response;
}

// Preferences
export async function getPreferences() {
  if (MOCK_MODE) return {};
  const res = await fetch('/api/preferences', { headers: authHeaders() });
  if (!res.ok) return {};
  return res.json();
}

export async function savePreferences(prefs) {
  if (MOCK_MODE) return { success: true };
  const res = await fetch('/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error('Failed to save');
  return res.json();
}

// Cart
export async function getCart() {
  if (MOCK_MODE) {
    return JSON.parse(localStorage.getItem('mockCart') || '[]');
  }
  const res = await fetch('/api/cart', { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function addToCart(item) {
  if (MOCK_MODE) {
    const cart = JSON.parse(localStorage.getItem('mockCart') || '[]');
    item.id = Math.random().toString(36).slice(2);
    item.addedAt = new Date().toISOString();
    cart.push(item);
    localStorage.setItem('mockCart', JSON.stringify(cart));
    return { success: true, cart };
  }

  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to add');
  return res.json();
}

export async function removeFromCart(id) {
  if (MOCK_MODE) {
    let cart = JSON.parse(localStorage.getItem('mockCart') || '[]');
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('mockCart', JSON.stringify(cart));
    return { success: true, cart };
  }

  const res = await fetch('/api/cart', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to remove');
  return res.json();
}

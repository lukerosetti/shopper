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
    return { response: getMockResponse(), usage: { usedTokens: 2, remainingTokens: 73, totalTokens: 75, costTokens: 2, hadWebSearch: false } };
  }

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ messages }),
  });

  if (res.status === 429) {
    const data = await res.json();
    throw new Error(data.message || "You've used all your tokens for today!");
  }

  if (!res.ok) throw new Error('Failed to get response');
  const data = await res.json();
  return { response: data.response, usage: data.usage };
}

// Usage
export async function getUsage() {
  if (MOCK_MODE) {
    return { usedTokens: 5, remainingTokens: 70, totalTokens: 75, limitReached: false };
  }
  const res = await fetch('/api/usage', { headers: authHeaders() });
  if (!res.ok) return { usedTokens: 0, remainingTokens: 75, totalTokens: 75, limitReached: false };
  return res.json();
}

// Coupons
export async function searchCoupons(stores) {
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 1000));
    return `[COUPON]
store: Uniqlo
code: SPRING25
discount: 25% off
details: Spring sale on select items
expires: April 2026
[/COUPON]

[COUPON]
store: H&M
code: WELCOME15
discount: 15% off
details: First purchase discount
expires: Unknown
[/COUPON]`;
  }

  const res = await fetch('/api/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ stores }),
  });

  if (res.status === 429) {
    throw new Error('Daily token limit reached');
  }
  if (!res.ok) throw new Error('Failed to search coupons');
  const data = await res.json();
  return data.coupons;
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

// Feedback
export async function saveFeedback(item) {
  if (MOCK_MODE) {
    const feedback = JSON.parse(localStorage.getItem('mockFeedback') || '[]');
    feedback.push({ ...item, timestamp: new Date().toISOString() });
    localStorage.setItem('mockFeedback', JSON.stringify(feedback.slice(-50)));
    return { success: true };
  }

  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to save feedback');
  return res.json();
}

export async function clearFeedback() {
  if (MOCK_MODE) {
    localStorage.removeItem('mockFeedback');
    return { success: true };
  }

  const res = await fetch('/api/feedback', {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to clear feedback');
  return res.json();
}

// Reset preferences
export async function resetPreferences() {
  if (MOCK_MODE) return { success: true };

  const res = await fetch('/api/preferences', {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to reset');
  return res.json();
}

// Chat History
export async function getChatHistory() {
  if (MOCK_MODE) {
    return JSON.parse(localStorage.getItem('mockHistory') || '[]');
  }
  const res = await fetch('/api/history', { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function saveChatHistory(id, title, messages) {
  if (MOCK_MODE) {
    const history = JSON.parse(localStorage.getItem('mockHistory') || '[]');
    const entry = { id, title, messages, messageCount: messages.length, savedAt: new Date().toISOString() };
    const existing = history.findIndex(c => c.id === id);
    if (existing >= 0) history[existing] = entry;
    else history.unshift(entry);
    localStorage.setItem('mockHistory', JSON.stringify(history.slice(0, 20)));
    return { success: true, chats: history };
  }
  const res = await fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ id, title, messages }),
  });
  if (!res.ok) throw new Error('Failed to save');
  return res.json();
}

export async function deleteChatHistory(id) {
  if (MOCK_MODE) {
    let history = JSON.parse(localStorage.getItem('mockHistory') || '[]');
    if (id) history = history.filter(c => c.id !== id);
    else history = [];
    localStorage.setItem('mockHistory', JSON.stringify(history));
    return { success: true, chats: history };
  }
  const res = await fetch('/api/history', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
}

// Wishlist
export async function getWishlist() {
  if (MOCK_MODE) {
    return JSON.parse(localStorage.getItem('mockWishlist') || '[]');
  }
  const res = await fetch('/api/wishlist', { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function addToWishlist(item) {
  if (MOCK_MODE) {
    const wishlist = JSON.parse(localStorage.getItem('mockWishlist') || '[]');
    item.id = Math.random().toString(36).slice(2);
    item.addedAt = new Date().toISOString();
    wishlist.push(item);
    localStorage.setItem('mockWishlist', JSON.stringify(wishlist));
    return { success: true, wishlist };
  }
  const res = await fetch('/api/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to add');
  return res.json();
}

export async function removeFromWishlist(id) {
  if (MOCK_MODE) {
    let wishlist = JSON.parse(localStorage.getItem('mockWishlist') || '[]');
    wishlist = wishlist.filter(i => i.id !== id);
    localStorage.setItem('mockWishlist', JSON.stringify(wishlist));
    return { success: true, wishlist };
  }
  const res = await fetch('/api/wishlist', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to remove');
  return res.json();
}

export async function moveWishlistToCart(id) {
  if (MOCK_MODE) {
    let wishlist = JSON.parse(localStorage.getItem('mockWishlist') || '[]');
    const item = wishlist.find(i => i.id === id);
    if (!item) throw new Error('Not found');
    wishlist = wishlist.filter(i => i.id !== id);
    localStorage.setItem('mockWishlist', JSON.stringify(wishlist));
    const cart = JSON.parse(localStorage.getItem('mockCart') || '[]');
    cart.push({ ...item, id: Math.random().toString(36).slice(2), addedAt: new Date().toISOString() });
    localStorage.setItem('mockCart', JSON.stringify(cart));
    return { success: true, wishlist, cart };
  }
  const res = await fetch('/api/wishlist', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to move');
  return res.json();
}

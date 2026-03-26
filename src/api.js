const MOCK_MODE = localStorage.getItem('shopperMockMode') === 'true';

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

export async function sendMessage(messages) {
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 800));
    return getMockResponse();
  }

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error('Failed to get response');
  }

  const data = await res.json();
  return data.response;
}

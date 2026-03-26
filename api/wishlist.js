const { kv } = require('@vercel/kv');
const crypto = require('crypto');

async function validateAuth(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return false;
  const valid = await kv.get(`session:${token}`);
  return !!valid;
}

module.exports = async function handler(req, res) {
  if (!(await validateAuth(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const wishlist = await kv.get('wishlist:user') || [];
    return res.json(wishlist);
  }

  if (req.method === 'POST') {
    const item = req.body;
    item.id = crypto.randomBytes(8).toString('hex');
    item.addedAt = new Date().toISOString();

    const wishlist = await kv.get('wishlist:user') || [];
    wishlist.push(item);
    await kv.set('wishlist:user', wishlist);

    return res.json({ success: true, wishlist });
  }

  // PUT - move item from wishlist to cart
  if (req.method === 'PUT') {
    const { id } = req.body;
    let wishlist = await kv.get('wishlist:user') || [];
    const item = wishlist.find(i => i.id === id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    // Add to cart
    const cart = await kv.get('cart:user') || [];
    const cartItem = { ...item, id: crypto.randomBytes(8).toString('hex'), addedAt: new Date().toISOString() };
    cart.push(cartItem);
    await kv.set('cart:user', cart);

    // Remove from wishlist
    wishlist = wishlist.filter(i => i.id !== id);
    await kv.set('wishlist:user', wishlist);

    return res.json({ success: true, wishlist, cart });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    let wishlist = await kv.get('wishlist:user') || [];
    wishlist = wishlist.filter(item => item.id !== id);
    await kv.set('wishlist:user', wishlist);

    return res.json({ success: true, wishlist });
  }

  res.status(405).json({ error: 'Method not allowed' });
};

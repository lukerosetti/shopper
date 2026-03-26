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
    const cart = await kv.get('cart:user') || [];
    return res.json(cart);
  }

  if (req.method === 'POST') {
    const item = req.body;
    item.id = crypto.randomBytes(8).toString('hex');
    item.addedAt = new Date().toISOString();

    const cart = await kv.get('cart:user') || [];
    cart.push(item);
    await kv.set('cart:user', cart);

    return res.json({ success: true, cart });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    let cart = await kv.get('cart:user') || [];
    cart = cart.filter(item => item.id !== id);
    await kv.set('cart:user', cart);

    return res.json({ success: true, cart });
  }

  res.status(405).json({ error: 'Method not allowed' });
};

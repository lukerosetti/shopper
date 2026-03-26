const { kv } = require('@vercel/kv');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    // Login with PIN
    const { pin } = req.body;
    const correctPin = process.env.SHOPPER_PIN;

    if (!correctPin) {
      return res.status(500).json({ error: 'PIN not configured' });
    }

    if (pin !== correctPin) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await kv.set(`session:${token}`, true, { ex: 60 * 60 * 24 * 30 }); // 30 days

    return res.json({ token });
  }

  if (req.method === 'GET') {
    // Validate session token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ valid: false });
    }

    const valid = await kv.get(`session:${token}`);
    return res.json({ valid: !!valid });
  }

  res.status(405).json({ error: 'Method not allowed' });
};

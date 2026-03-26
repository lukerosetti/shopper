const { kv } = require('@vercel/kv');

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
    const feedback = await kv.get('feedback:user') || [];
    return res.json(feedback);
  }

  if (req.method === 'POST') {
    const { name, store, price, liked } = req.body;
    const feedback = await kv.get('feedback:user') || [];

    feedback.push({
      name,
      store,
      price,
      liked,
      timestamp: new Date().toISOString(),
    });

    // Cap at 50 most recent
    const capped = feedback.slice(-50);
    await kv.set('feedback:user', capped);

    return res.json({ success: true });
  }

  if (req.method === 'DELETE') {
    await kv.set('feedback:user', []);
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};

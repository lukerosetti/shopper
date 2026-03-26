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
    const prefs = await kv.get('prefs:user') || {};
    return res.json(prefs);
  }

  if (req.method === 'PUT') {
    const prefs = req.body;
    await kv.set('prefs:user', prefs);
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};

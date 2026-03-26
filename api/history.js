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

  // GET - list all saved chats (returns summaries, not full messages)
  if (req.method === 'GET') {
    const chats = await kv.get('history:user') || [];
    return res.json(chats);
  }

  // POST - save a chat session
  if (req.method === 'POST') {
    const { id, title, messages } = req.body;
    const chats = await kv.get('history:user') || [];

    const existing = chats.findIndex(c => c.id === id);
    const entry = {
      id: id || Date.now().toString(36),
      title: title || messages.find(m => m.role === 'user')?.content?.slice(0, 50) || 'Chat',
      messageCount: messages.length,
      messages,
      savedAt: new Date().toISOString(),
    };

    if (existing >= 0) {
      chats[existing] = entry;
    } else {
      chats.unshift(entry);
    }

    // Keep max 20 chats
    const trimmed = chats.slice(0, 20);
    await kv.set('history:user', trimmed);
    return res.json({ success: true, chats: trimmed });
  }

  // DELETE - delete a chat or clear all
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (id) {
      let chats = await kv.get('history:user') || [];
      chats = chats.filter(c => c.id !== id);
      await kv.set('history:user', chats);
      return res.json({ success: true, chats });
    } else {
      await kv.set('history:user', []);
      return res.json({ success: true, chats: [] });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};

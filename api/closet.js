const Anthropic = require('@anthropic-ai/sdk').default;
const { kv } = require('@vercel/kv');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DAILY_LIMIT = parseFloat(process.env.DAILY_API_LIMIT || '0.75');

function getTodayKey() {
  const today = new Date().toISOString().split('T')[0];
  return `usage:${today}`;
}

const KEY = 'closet:user';

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const items = await kv.get(KEY) || [];
    return res.json(items);
  }

  if (req.method === 'POST') {
    // Analyze image and add to closet
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Image required' });

    // Check usage limit
    const usageKey = getTodayKey();
    const currentUsage = parseFloat(await kv.get(usageKey) || '0');
    if (currentUsage >= DAILY_LIMIT) {
      return res.status(429).json({ error: 'Daily token limit reached' });
    }

    try {
      // Use Claude vision to analyze the clothing item
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType || 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Describe this clothing item concisely. Include: type (shirt, pants, jacket, etc.), color(s), style (casual, formal, sporty, etc.), material if visible, fit (loose, fitted, oversized, etc.), and any notable details (patterns, logos, embellishments). Keep it to 2-3 sentences max.',
            },
          ],
        }],
      });

      const description = response.content[0]?.text || 'Clothing item';

      // Track usage (~$0.01-0.02 for image analysis)
      const estimatedCost = 0.02;
      const newUsage = currentUsage + estimatedCost;
      await kv.set(usageKey, newUsage.toString(), { ex: 172800 });

      // Save to closet
      const items = await kv.get(KEY) || [];
      const item = {
        id: Math.random().toString(36).slice(2),
        description,
        addedAt: new Date().toISOString(),
      };
      items.unshift(item);
      await kv.set(KEY, items.slice(0, 50));

      return res.json({ success: true, item, items });
    } catch (error) {
      console.error('Closet analysis error:', error.message);
      return res.status(500).json({ error: 'Failed to analyze image' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (id) {
      let items = await kv.get(KEY) || [];
      items = items.filter(i => i.id !== id);
      await kv.set(KEY, items);
      return res.json({ success: true, items });
    } else {
      // Clear all
      await kv.set(KEY, []);
      return res.json({ success: true, items: [] });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

module.exports.config = {
  maxDuration: 30,
};

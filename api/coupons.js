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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check usage limit
  const key = getTodayKey();
  const currentUsage = parseFloat(await kv.get(key) || '0');
  if (currentUsage >= DAILY_LIMIT) {
    return res.status(429).json({ error: 'Daily token limit reached' });
  }

  const { stores } = req.body;
  if (!stores || !stores.length) {
    return res.status(400).json({ error: 'No stores provided' });
  }

  const uniqueStores = [...new Set(stores.map(s => s.toLowerCase()))];
  const storeList = uniqueStores.join(', ');

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: `You are a coupon and discount code finder. Search the web for current, working promo codes and discounts. Be concise.

For each store, return results in this exact format:
[COUPON]
store: Store Name
code: PROMOCODE123
discount: 20% off or $10 off
details: Brief description of the deal
expires: Expiry date if known, or "Unknown"
[/COUPON]

If you can't find any working codes for a store, say so briefly. Only include codes that appear to be currently valid.`,
      tools: [
        { type: 'web_search_20250305', name: 'web_search' }
      ],
      messages: [
        { role: 'user', content: `Find current promo codes and discount codes for these stores: ${storeList}` }
      ],
    });

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Estimate cost: ~$0.03 for haiku + web search
    const estimatedCost = 0.04;
    const newUsage = currentUsage + estimatedCost;
    await kv.set(key, newUsage.toString(), { ex: 172800 });

    res.json({ coupons: text });
  } catch (error) {
    console.error('Coupon search error:', error.message);
    res.status(500).json({ error: 'Failed to search for coupons' });
  }
};

module.exports.config = {
  maxDuration: 60,
};

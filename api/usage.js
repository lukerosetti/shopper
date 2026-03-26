const { kv } = require('@vercel/kv');

const DAILY_LIMIT = parseFloat(process.env.DAILY_API_LIMIT || '0.75');
const COST_PER_TOKEN = 0.01; // 1 token = $0.01

function getTodayKey() {
  const today = new Date().toISOString().split('T')[0];
  return `usage:${today}`;
}

module.exports = async function handler(req, res) {
  const key = getTodayKey();

  if (req.method === 'GET') {
    // Get current usage
    const usage = parseFloat(await kv.get(key) || '0');
    const limitTokens = Math.round(DAILY_LIMIT / COST_PER_TOKEN);
    const usedTokens = Math.round(usage / COST_PER_TOKEN);
    const remainingTokens = Math.max(0, limitTokens - usedTokens);

    return res.json({
      usedTokens,
      remainingTokens,
      totalTokens: limitTokens,
      limitReached: usage >= DAILY_LIMIT,
    });
  }

  if (req.method === 'POST') {
    // Add usage cost
    const { cost } = req.body;
    if (typeof cost !== 'number') {
      return res.status(400).json({ error: 'Cost required' });
    }

    const current = parseFloat(await kv.get(key) || '0');
    const newUsage = current + cost;
    // Set with 48 hour expiry so old days auto-clean
    await kv.set(key, newUsage.toString(), { ex: 172800 });

    const limitTokens = Math.round(DAILY_LIMIT / COST_PER_TOKEN);
    const usedTokens = Math.round(newUsage / COST_PER_TOKEN);
    const remainingTokens = Math.max(0, limitTokens - usedTokens);

    return res.json({
      usedTokens,
      remainingTokens,
      totalTokens: limitTokens,
      limitReached: newUsage >= DAILY_LIMIT,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

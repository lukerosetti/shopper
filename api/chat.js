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

const BASE_PROMPT = `You are a friendly, expert clothing shopping assistant. Your job is to help someone find exactly what they're looking for and surface great deals.

CONVERSATION FLOW:
1. Start by asking what they're shopping for (type of clothing item)
2. Ask smart follow-up questions to gather ALL of these before searching:
   - Occasion (casual, work, date night, athletic, etc.)
   - Style/fit preferences (fitted, oversized, minimalist, streetwear, etc.)
   - Budget range
   - Size
   - Color preferences
   - Brand preferences or brands to avoid
   You can ask 2-3 questions at a time to keep it conversational.
   If you already know some of these from the user's saved preferences, skip those questions!
3. ONLY search the web after you have ALL the info above. Do NOT search early.
4. Before searching, ALWAYS confirm with the user first. Say something like "I have everything I need! Ready for me to search?" or "Great, I'll search for [brief summary]. Sound good?" Wait for their confirmation before using the web search tool.
5. Do ONE focused web search that covers everything, then present at least 5 product recommendations (aim for 5-8).
6. If they want refinements, try to adjust your recommendations from memory first. Only search again if they change major criteria (different item, different budget, etc.)

WHEN PRESENTING PRODUCTS, use this exact format for each product so the app can parse them:

[PRODUCT]
name: Product Name Here
price: $XX.XX
store: Store Name
url: https://actual-link-to-product
image: https://direct-image-url.jpg
description: Brief 1-sentence description
[/PRODUCT]

IMPORTANT RULES:
- Be conversational and warm, not robotic
- Ask questions naturally — like a knowledgeable friend helping them shop
- MINIMIZE web searches — gather all preferences first, then do ONE search. Web searches cost money.
- When you do search, find real products with real URLs and real image URLs
- Every product MUST have a working image URL from the retailer's website
- Prioritize deals and good value
- Always return at least 5 products. Aim for 5-8 products per search.
- Include a mix of price points within their budget
- After showing products, ask if they want to refine the search or look at something else
- Keep responses concise — this is a mobile chat interface`;

async function buildSystemPrompt() {
  let prompt = BASE_PROMPT;

  try {
    const prefs = await kv.get('prefs:user');
    if (prefs && Object.keys(prefs).length > 0) {
      prompt += '\n\nUSER PREFERENCES (already saved — use these and skip asking about them):';
      if (prefs.sizes) {
        const sizes = [];
        if (prefs.sizes.tops) sizes.push(`Tops: ${prefs.sizes.tops}`);
        if (prefs.sizes.bottoms) sizes.push(`Bottoms: ${prefs.sizes.bottoms}`);
        if (prefs.sizes.shoes) sizes.push(`Shoes: ${prefs.sizes.shoes}`);
        if (sizes.length) prompt += `\n- Sizes: ${sizes.join(', ')}`;
      }
      if (prefs.styles) prompt += `\n- Style: ${prefs.styles}`;
      if (prefs.budgetRange) prompt += `\n- Budget: ${prefs.budgetRange}`;
      if (prefs.favoriteStores) prompt += `\n- Favorite stores: ${prefs.favoriteStores}`;
      if (prefs.avoidBrands) prompt += `\n- Avoid brands: ${prefs.avoidBrands}`;
      if (prefs.colors) prompt += `\n- Favorite colors: ${prefs.colors}`;
      if (prefs.notes) prompt += `\n- Notes: ${prefs.notes}`;
    }
  } catch (e) {
    // KV not available, use base prompt
  }

  try {
    const feedback = await kv.get('feedback:user');
    if (feedback && feedback.length > 0) {
      const liked = feedback.filter(f => f.liked);
      const disliked = feedback.filter(f => !f.liked);

      prompt += '\n\nPRODUCT FEEDBACK HISTORY (use this to understand her taste and recommend similar/avoid similar):';
      if (liked.length > 0) {
        prompt += '\nLIKED:';
        liked.forEach(f => {
          prompt += `\n- ${f.name}${f.store ? ` from ${f.store}` : ''}${f.price ? ` (${f.price})` : ''}`;
        });
      }
      if (disliked.length > 0) {
        prompt += '\nDISLIKED:';
        disliked.forEach(f => {
          prompt += `\n- ${f.name}${f.store ? ` from ${f.store}` : ''}${f.price ? ` (${f.price})` : ''}`;
        });
      }
    }
  } catch (e) {
    // Feedback not available, continue without it
  }

  return prompt;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check daily usage limit
    const key = getTodayKey();
    const currentUsage = parseFloat(await kv.get(key) || '0');
    if (currentUsage >= DAILY_LIMIT) {
      return res.status(429).json({
        error: 'daily_limit',
        message: "You've used all your tokens for today! Come back tomorrow for more shopping."
      });
    }

    const { messages } = req.body;
    const systemPrompt = await buildSystemPrompt();

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      tools: [
        { type: 'web_search_20250305', name: 'web_search' }
      ],
      messages: messages,
    });

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Estimate cost based on usage
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    // Haiku pricing: $0.80/1M input, $4/1M output
    const tokenCost = (inputTokens * 0.8 + outputTokens * 4) / 1000000;
    // Web search cost: ~$0.01-0.03 per search
    const hadWebSearch = response.content.some(b => b.type === 'tool_use' || b.type === 'tool_result');
    const searchCost = hadWebSearch ? 0.03 : 0;
    const totalCost = tokenCost + searchCost;

    // Record usage
    const newUsage = currentUsage + totalCost;
    await kv.set(key, newUsage.toString(), { ex: 172800 });

    const limitTokens = Math.round(DAILY_LIMIT / 0.01);
    const usedTokens = Math.round(newUsage / 0.01);

    res.json({
      response: text,
      usage: {
        usedTokens,
        remainingTokens: Math.max(0, limitTokens - usedTokens),
        totalTokens: limitTokens,
        costTokens: Math.max(1, Math.round(totalCost / 0.01)),
        hadWebSearch,
      }
    });
  } catch (error) {
    console.error('Claude API error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to get response from AI' });
  }
};

module.exports.config = {
  maxDuration: 60,
};

const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk').default;

const app = express();
app.use(express.json());

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a friendly, expert clothing shopping assistant. Your job is to help someone find exactly what they're looking for and surface great deals.

CONVERSATION FLOW:
1. Start by asking what they're shopping for (type of clothing item)
2. Ask smart follow-up questions one or two at a time — don't overwhelm them:
   - What's the occasion? (casual, work, date night, athletic, etc.)
   - Any style preferences? (fitted, oversized, minimalist, streetwear, etc.)
   - Budget range?
   - Preferred size?
   - Any brand preferences or brands to avoid?
   - Color preferences?
   - Any other must-haves? (material, sustainability, etc.)
3. Once you have enough info (usually after 2-3 exchanges), search the web for matching products
4. Present 3-5 product recommendations

WHEN PRESENTING PRODUCTS, use this exact format for each product so the app can parse them:

[PRODUCT]
name: Product Name Here
price: $XX.XX
store: Store Name
url: https://actual-link-to-product
image: https://image-url-if-available
description: Brief 1-sentence description
[/PRODUCT]

IMPORTANT RULES:
- Be conversational and warm, not robotic
- Ask questions naturally — like a knowledgeable friend helping them shop
- When searching, look for REAL products with REAL links that actually work
- Prioritize deals and good value
- Include a mix of price points within their budget
- After showing products, ask if they want to refine the search or look at something else
- Keep responses concise — this is a mobile chat interface`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    res.json({ response: text });
  } catch (error) {
    console.error('Claude API error:', error.message);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

// Serve React build in production
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

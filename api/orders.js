const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  const KEY = 'orders:user';

  if (req.method === 'GET') {
    const orders = await kv.get(KEY) || [];
    return res.json(orders);
  }

  if (req.method === 'POST') {
    // Add a new order (from cart item marked as purchased)
    const { item, trackingUrl, trackingNumber } = req.body;
    if (!item) return res.status(400).json({ error: 'Item required' });

    const orders = await kv.get(KEY) || [];
    const order = {
      id: Math.random().toString(36).slice(2),
      ...item,
      purchasedAt: new Date().toISOString(),
      trackingUrl: trackingUrl || '',
      trackingNumber: trackingNumber || '',
      status: 'purchased',
    };
    orders.unshift(order);
    await kv.set(KEY, orders.slice(0, 100));
    return res.json({ success: true, orders });
  }

  if (req.method === 'PUT') {
    // Update tracking info
    const { id, trackingUrl, trackingNumber, status } = req.body;
    if (!id) return res.status(400).json({ error: 'Order ID required' });

    const orders = await kv.get(KEY) || [];
    const order = orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (trackingUrl !== undefined) order.trackingUrl = trackingUrl;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (status) order.status = status;

    await kv.set(KEY, orders);
    return res.json({ success: true, orders });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Order ID required' });

    let orders = await kv.get(KEY) || [];
    orders = orders.filter(o => o.id !== id);
    await kv.set(KEY, orders);
    return res.json({ success: true, orders });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

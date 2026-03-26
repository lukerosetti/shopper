// Static return policy database — no API cost
const RETURN_POLICIES = {
  'zara': { days: 30, free: true, note: 'In-store or by mail. Tags must be attached.', url: 'https://www.zara.com/us/en/help/returns-and-exchanges' },
  'h&m': { days: 30, free: true, note: 'Free in-store returns. Online returns $5.99 shipping fee.', url: 'https://www2.hm.com/en_us/customer-service/returns.html' },
  'uniqlo': { days: 30, free: true, note: 'In-store free. Online returns $7 fee deducted from refund.', url: 'https://www.uniqlo.com/us/en/returns-exchanges' },
  'nordstrom': { days: -1, free: true, note: 'No time limit. Free returns by mail or in-store.', url: 'https://www.nordstrom.com/customer-service/return-policy' },
  'asos': { days: 45, free: true, note: 'Free returns within 45 days. Must be unworn with tags.', url: 'https://www.asos.com/us/customer-care/returns-refunds/' },
  'target': { days: 90, free: true, note: '90 days for most items. RedCard holders get extra 30 days.', url: 'https://www.target.com/returns' },
  'amazon': { days: 30, free: true, note: 'Most items within 30 days. Free return shipping on eligible items.', url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GKM69DUUYKQWKBER' },
  'shein': { days: 35, free: false, note: 'First return free per order. Additional returns $7.99.', url: 'https://us.shein.com/Return-Policy-a-281.html' },
  'nike': { days: 60, free: true, note: '60 days from purchase. Free returns. Items can be worn/tried.', url: 'https://www.nike.com/help/a/returns-policy' },
  'adidas': { days: 30, free: true, note: 'Free returns within 30 days. Must be unworn.', url: 'https://www.adidas.com/us/help/returns-refunds' },
  'gap': { days: 30, free: true, note: 'Free returns in-store. Mail returns $5.99 fee.', url: 'https://www.gap.com/customerService/info.do?cid=2254' },
  'old navy': { days: 30, free: true, note: 'Free in-store. Mail $5.99 fee. Clearance items final sale.', url: 'https://oldnavy.gap.com/customerService/info.do?cid=2254' },
  'mango': { days: 30, free: true, note: 'Free in-store returns. Mail returns may have shipping fee.', url: 'https://shop.mango.com/us/help/returns' },
  'everlane': { days: 30, free: true, note: 'Free first exchange. Returns $5.99 fee. Final sale items excluded.', url: 'https://www.everlane.com/returns' },
  'lululemon': { days: 30, free: true, note: 'Free returns. Items must be unworn with tags. Sale items final.', url: 'https://shop.lululemon.com/help/returns' },
  'anthropologie': { days: 30, free: true, note: 'Free returns in-store or by mail within 30 days.', url: 'https://www.anthropologie.com/help/returns' },
  'urban outfitters': { days: 30, free: true, note: 'Free in-store. Mail returns $5 restocking fee.', url: 'https://www.urbanoutfitters.com/help/returns' },
  'free people': { days: 30, free: true, note: 'Free returns in-store or by mail.', url: 'https://www.freepeople.com/help/returns-exchanges/' },
  'forever 21': { days: 30, free: false, note: 'In-store returns only. No mail returns. Tags must be attached.', url: 'https://www.forever21.com/us/CustomerService/ReturnPolicy' },
  'walmart': { days: 90, free: true, note: '90 days. Free in-store or mail returns.', url: 'https://www.walmart.com/cp/returns/1231920' },
  'revolve': { days: 30, free: true, note: 'Free returns and exchanges. Items must be unworn.', url: 'https://www.revolve.com/page/returns/' },
  'abercrombie & fitch': { days: 30, free: true, note: 'Free returns in-store or by mail.', url: 'https://www.abercrombie.com/shop/us/help/returns-exchanges' },
  'madewell': { days: 30, free: true, note: 'Free returns in-store. Mail $5.99 fee.', url: 'https://www.madewell.com/help/returns-exchanges.html' },
  'cos': { days: 30, free: true, note: 'Free returns within 30 days. Tags attached, unworn.', url: 'https://www.cos.com/en_usd/customer-service/returns.html' },
  '& other stories': { days: 30, free: true, note: 'Free returns in-store. Online $3.99 fee.', url: 'https://www.stories.com/en_usd/customer-service/returns.html' },
  'topshop': { days: 28, free: true, note: '28 days for refund. Free returns via ASOS.', url: 'https://www.asos.com/us/customer-care/returns-refunds/' },
  'j.crew': { days: 30, free: true, note: 'Free in-store. Mail returns $7.50 fee.', url: 'https://www.jcrew.com/help/returns_exchanges.jsp' },
  'banana republic': { days: 30, free: true, note: 'Free in-store. Mail $5.99 fee.', url: 'https://bananarepublic.gap.com/customerService/info.do?cid=2254' },
  'puma': { days: 30, free: true, note: 'Free returns within 30 days. Items must be unworn.', url: 'https://us.puma.com/us/en/help/returns-and-exchange' },
  'new balance': { days: 45, free: true, note: '45 days for returns. Free return shipping.', url: 'https://www.newbalance.com/returns.html' },
};

export function getReturnPolicy(storeName) {
  if (!storeName) return null;
  const key = storeName.toLowerCase().trim();
  // Try exact match first
  if (RETURN_POLICIES[key]) return RETURN_POLICIES[key];
  // Try partial match
  for (const [store, policy] of Object.entries(RETURN_POLICIES)) {
    if (key.includes(store) || store.includes(key)) return policy;
  }
  return null;
}

export function formatReturnPolicy(policy) {
  if (!policy) return 'Return policy not available for this store.';
  const days = policy.days === -1 ? 'No time limit' : `${policy.days} days`;
  const freeLabel = policy.free ? 'Free returns' : 'Return fee may apply';
  return `${days} · ${freeLabel}${policy.note ? ` · ${policy.note}` : ''}`;
}

import React, { useState, useEffect } from 'react';
import { getCart, removeFromCart, searchCoupons, markAsPurchased } from './api';
import { getReturnPolicy } from './returnPolicies';

function parseCoupons(text) {
  const coupons = [];
  const regex = /\[COUPON\]([\s\S]*?)\[\/COUPON\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const block = match[1];
    const coupon = {};
    const fields = ['store', 'code', 'discount', 'details', 'expires'];
    fields.forEach(field => {
      const fieldMatch = block.match(new RegExp(`${field}:\\s*(.+)`, 'i'));
      if (fieldMatch) coupon[field] = fieldMatch[1].trim();
    });
    if (coupon.store || coupon.code) coupons.push(coupon);
  }
  return coupons;
}

function Cart({ onBack, cartItems, setCartItems }) {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSearched, setCouponSearched] = useState(false);

  useEffect(() => {
    getCart().then(items => {
      setCartItems(items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [setCartItems]);

  const handleRemove = async (id) => {
    try {
      const result = await removeFromCart(id);
      setCartItems(result.cart || []);
    } catch (err) {
      alert('Failed to remove item');
    }
  };

  const handleFindCoupons = async () => {
    const stores = [...new Set(cartItems.map(i => i.store).filter(Boolean))];
    if (stores.length === 0) return;

    setCouponLoading(true);
    setCouponError('');
    try {
      const result = await searchCoupons(stores);
      const parsed = parseCoupons(result);
      setCoupons(parsed);
      setCouponSearched(true);
      if (parsed.length === 0) {
        setCouponError('No coupons found right now. Check back later!');
      }
    } catch (err) {
      setCouponError(err.message.includes('token') ? 'Not enough tokens to search. Try again tomorrow!' : 'Could not search for coupons right now.');
    } finally {
      setCouponLoading(false);
    }
  };

  const total = cartItems.reduce((sum, item) => {
    const price = parseFloat((item.price || '').replace(/[^0-9.]/g, ''));
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  if (loading) return <div className="cart-loading">Loading cart...</div>;

  return (
    <div className="cart-view">
      <div className="cart-header">
        <button className="cart-back" onClick={onBack}>Back</button>
        <h2>Cart ({cartItems.length})</h2>
        {cartItems.length > 0 && (
          <button className="share-btn" onClick={() => {
            const text = cartItems.map(item =>
              `${item.name} - ${item.price || ''} (${item.store || ''})\n${item.url || ''}`
            ).join('\n\n');
            if (navigator.share) {
              navigator.share({ title: 'My Shopping Cart', text }).catch(() => {});
            } else {
              navigator.clipboard.writeText(text).then(() => alert('Cart copied to clipboard!'));
            }
          }}>Share</button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty</p>
          <p className="cart-empty-sub">Add items from chat recommendations</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                {item.imageUrl && (
                  <div className="cart-item-image">
                    <img src={`/api/image?url=${encodeURIComponent(item.url || item.imageUrl)}`} alt={item.name} onError={e => { e.target.style.display = 'none'; }} />
                  </div>
                )}
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{item.price}</div>
                  <div className="cart-item-store">{item.store}</div>
                  {item.store && getReturnPolicy(item.store) && (
                    <div className="cart-item-return">↩ {getReturnPolicy(item.store).days === -1 ? 'No time limit' : `${getReturnPolicy(item.store).days} day`} returns{getReturnPolicy(item.store).free ? ' · Free' : ''}</div>
                  )}
                  <div className="cart-item-actions">
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="cart-buy-btn">Buy</a>
                    )}
                    <button className="cart-purchased-btn" onClick={async () => {
                      try {
                        await markAsPurchased(item);
                        await handleRemove(item.id);
                      } catch (e) { alert('Failed'); }
                    }}>Purchased</button>
                    <button className="cart-remove-btn" onClick={() => handleRemove(item.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-bottom">
          <div className="cart-total">
            <span>Estimated Total</span>
            <span className="cart-total-price">${total.toFixed(2)}</span>
          </div>

          {/* Coupon Section */}
          <div className="coupon-section">
            {!couponSearched ? (
              <button
                className="find-coupons-btn"
                onClick={handleFindCoupons}
                disabled={couponLoading}
              >
                {couponLoading ? 'Searching for deals...' : 'Find Coupon Codes'}
              </button>
            ) : (
              <div className="coupon-results">
                <div className="coupon-results-header">
                  <span>Coupon Codes</span>
                  <button className="coupon-refresh" onClick={handleFindCoupons} disabled={couponLoading}>
                    {couponLoading ? '...' : 'Refresh'}
                  </button>
                </div>
                {couponError && <p className="coupon-error">{couponError}</p>}
                {coupons.map((coupon, i) => (
                  <div key={i} className="coupon-card">
                    <div className="coupon-store">{coupon.store}</div>
                    <div className="coupon-code" onClick={() => {
                      navigator.clipboard.writeText(coupon.code || '');
                      const el = document.getElementById(`coupon-${i}`);
                      if (el) { el.textContent = 'Copied!'; setTimeout(() => { el.textContent = coupon.code; }, 1500); }
                    }}>
                      <span id={`coupon-${i}`}>{coupon.code}</span>
                      <span className="coupon-copy-hint">tap to copy</span>
                    </div>
                    <div className="coupon-discount">{coupon.discount}</div>
                    {coupon.details && <div className="coupon-details">{coupon.details}</div>}
                    {coupon.expires && coupon.expires !== 'Unknown' && (
                      <div className="coupon-expires">Expires: {coupon.expires}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;

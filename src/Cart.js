import React, { useState, useEffect } from 'react';
import { getCart, removeFromCart } from './api';

function Cart({ onBack, cartItems, setCartItems }) {
  const [loading, setLoading] = useState(true);

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
                  <div className="cart-item-actions">
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="cart-buy-btn">Buy</a>
                    )}
                    <button className="cart-remove-btn" onClick={() => handleRemove(item.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-total">
            <span>Estimated Total</span>
            <span className="cart-total-price">${total.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;

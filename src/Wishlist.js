import React, { useState, useEffect } from 'react';
import { getWishlist, removeFromWishlist, moveWishlistToCart } from './api';

function Wishlist({ onBack, setCartItems }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWishlist().then(w => { setItems(w || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleRemove = async (id) => {
    try {
      const result = await removeFromWishlist(id);
      setItems(result.wishlist || []);
    } catch { /* silent */ }
  };

  const handleMoveToCart = async (id) => {
    try {
      const result = await moveWishlistToCart(id);
      setItems(result.wishlist || []);
      if (setCartItems) setCartItems(result.cart || []);
    } catch { /* silent */ }
  };

  const handleShare = () => {
    const text = items.map(item =>
      `${item.name} - ${item.price || ''} (${item.store || ''})\n${item.url || ''}`
    ).join('\n\n');

    if (navigator.share) {
      navigator.share({ title: 'My Wishlist', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Wishlist copied to clipboard!'));
    }
  };

  if (loading) return <div className="cart-loading">Loading wishlist...</div>;

  return (
    <div className="cart-view">
      <div className="cart-header">
        <button className="cart-back" onClick={onBack}>Back</button>
        <h2>Wishlist ({items.length})</h2>
        {items.length > 0 && (
          <button className="share-btn" onClick={handleShare}>Share</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p>Your wishlist is empty</p>
          <p className="cart-empty-sub">Save items you like for later</p>
        </div>
      ) : (
        <div className="cart-items">
          {items.map(item => (
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
                  <button className="cart-buy-btn" onClick={() => handleMoveToCart(item.id)}>Move to Cart</button>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="cart-buy-btn">View</a>
                  )}
                  <button className="cart-remove-btn" onClick={() => handleRemove(item.id)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;

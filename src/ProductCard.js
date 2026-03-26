import React from 'react';

function parseProducts(text) {
  const products = [];
  const regex = /\[PRODUCT\]([\s\S]*?)\[\/PRODUCT\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const block = match[1];
    const product = {};
    const lines = block.trim().split('\n');
    for (const line of lines) {
      const idx = line.indexOf(':');
      if (idx > -1) {
        const key = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        product[key] = value;
      }
    }
    if (product.name) products.push(product);
  }

  return products;
}

function getTextWithoutProducts(text) {
  return text.replace(/\[PRODUCT\][\s\S]*?\[\/PRODUCT\]/g, '').trim();
}

function proxyImageUrl(url) {
  if (!url) return null;
  return `/api/image?url=${encodeURIComponent(url)}`;
}

function ProductCard({ product, onAddToCart, onAddToWishlist, onFeedback }) {
  const [imgError, setImgError] = React.useState(false);
  const [added, setAdded] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [wishlisted, setWishlisted] = React.useState(false);
  const [vote, setVote] = React.useState(null); // null, 'up', 'down'
  const imageSource = product.url || product.image;
  const proxiedImage = proxyImageUrl(imageSource);

  const handleAdd = async () => {
    if (onAddToCart && !adding) {
      setAdding(true);
      const success = await onAddToCart(product);
      setAdding(false);
      if (success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
    }
  };

  const handleVote = (liked) => {
    if (vote !== null) return;
    setVote(liked ? 'up' : 'down');
    if (onFeedback) {
      onFeedback(product, liked);
    }
  };

  return (
    <div className="product-card">
      {proxiedImage && !imgError && (
        <div className="product-image">
          <img src={proxiedImage} alt={product.name} onError={() => setImgError(true)} />
        </div>
      )}
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        {product.price && <div className="product-price">{product.price}</div>}
        {product.store && <div className="product-store">{product.store}</div>}
        {product.description && <div className="product-desc">{product.description}</div>}
        <div className="product-actions">
          {product.url && (
            <a href={product.url} target="_blank" rel="noopener noreferrer" className="product-link">
              View Deal →
            </a>
          )}
          <button className={`add-cart-btn ${added ? 'added' : ''}`} onClick={handleAdd} disabled={added || adding}>
            {adding ? 'Adding...' : added ? 'Added!' : 'Add to Cart'}
          </button>
          <button
            className={`wishlist-btn ${wishlisted ? 'wishlisted' : ''}`}
            onClick={async () => {
              if (onAddToWishlist && !wishlisted) {
                const ok = await onAddToWishlist(product);
                if (ok) setWishlisted(true);
              }
            }}
            disabled={wishlisted}
          >
            {wishlisted ? '♥ Saved' : '♡ Save'}
          </button>
        </div>
        <div className="product-feedback">
          <button
            className={`feedback-btn feedback-up ${vote === 'up' ? 'active' : ''}`}
            onClick={() => handleVote(true)}
            disabled={vote !== null}
            title="I like this"
          >👍</button>
          <button
            className={`feedback-btn feedback-down ${vote === 'down' ? 'active' : ''}`}
            onClick={() => handleVote(false)}
            disabled={vote !== null}
            title="Not for me"
          >👎</button>
          {vote && <span className="feedback-label">{vote === 'up' ? 'Noted!' : 'Got it!'}</span>}
        </div>
      </div>
    </div>
  );
}

export { parseProducts, getTextWithoutProducts };
export default ProductCard;

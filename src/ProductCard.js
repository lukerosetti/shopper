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

function ProductCard({ product }) {
  return (
    <div className="product-card">
      {product.image && (
        <div className="product-image">
          <img src={product.image} alt={product.name} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      )}
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        {product.price && <div className="product-price">{product.price}</div>}
        {product.store && <div className="product-store">{product.store}</div>}
        {product.description && <div className="product-desc">{product.description}</div>}
        {product.url && (
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="product-link">
            View Deal →
          </a>
        )}
      </div>
    </div>
  );
}

export { parseProducts, getTextWithoutProducts };
export default ProductCard;

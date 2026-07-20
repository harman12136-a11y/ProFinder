import { Link } from 'react-router-dom';
import { formatINR } from '../utils/validation';
import { ExternalLink, Trash2, Package } from 'lucide-react';
import './PurchaseCard.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PurchaseCard({ purchase, product, onRemove }) {
  const thumbnail = product?.photos?.[0] || null;
  const accessUrl = product?.demoUrl || product?.url || null;

  return (
    <article className="purchase-card card">
      <Link to={product ? `/software/${product.id}` : '#'} className="purchase-card-media">
        {thumbnail ? (
          <img src={thumbnail} alt={purchase.productTitle} />
        ) : (
          <div className="purchase-card-placeholder">
            <Package size={28} />
          </div>
        )}
      </Link>

      <div className="purchase-card-body">
        <div className="purchase-card-top">
          <div>
            <h3>
              {product ? (
                <Link to={`/software/${product.id}`}>{purchase.productTitle}</Link>
              ) : (
                purchase.productTitle
              )}
            </h3>
            <p className="purchase-card-seller">
              by{' '}
              <Link to={`/creator/${purchase.sellerId}`}>{purchase.sellerName}</Link>
            </p>
          </div>
          <span className="purchase-card-price">{formatINR(purchase.price)}</span>
        </div>

        <div className="purchase-card-meta">
          <span>Purchased {formatDate(purchase.purchasedAt)}</span>
          {purchase.license && <span className="purchase-card-license">{purchase.license} License</span>}
          {!product && <span className="purchase-card-unavailable">Product no longer available</span>}
        </div>

        <div className="purchase-card-actions">
          {product && (
            <Link to={`/software/${product.id}`} className="btn btn-outline btn-sm">
              View product
            </Link>
          )}
          {accessUrl && (
            <a
              href={accessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
            >
              <ExternalLink size={14} /> Access
            </a>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm purchase-card-remove"
            onClick={() => onRemove(purchase.id)}
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>
    </article>
  );
}

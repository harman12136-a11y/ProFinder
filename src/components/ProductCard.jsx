import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatINR } from '../utils/validation';
import { getUserById, getProductRating } from '../utils/storage';
import SaveButton from './SaveButton';
import VerifiedBadge from './VerifiedBadge';
import StarRating from './StarRating';
import './ProductCard.css';
import './VerifiedBadge.css';

function isFeatured(product) {
  return product.featured && product.featuredUntil && new Date(product.featuredUntil) > new Date();
}

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const thumbnail = product.photos?.[0] || null;
  const seller = getUserById(product.sellerId);
  const { avg, count } = getProductRating(product.id);

  return (
    <motion.article
      className="product-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <button
        type="button"
        className="product-card-media"
        onClick={() => navigate(`/software/${product.id}`)}
      >
        <SaveButton productId={product.id} />
        <div className="product-card-tags">
          {isFeatured(product) && <span className="featured-tag">Featured</span>}
          {product.builtWithIndia && <span className="india-tag">🇮🇳 Built With India</span>}
        </div>
        {thumbnail ? (
          <img src={thumbnail} alt={product.title} />
        ) : (
          <div className="product-card-placeholder">
            <span>{product.title.charAt(0)}</span>
          </div>
        )}
      </button>
      <div className="product-card-body">
        <Link to={`/software/${product.id}`} className="product-card-title">
          {product.title}
        </Link>
        <div className="product-card-creator-row">
          <Link to={`/creator/${product.sellerId}`} className="product-card-creator">
            {product.sellerName}
          </Link>
          {seller && <VerifiedBadge user={seller} />}
        </div>
        {count > 0 && (
          <div className="product-card-rating">
            <StarRating value={Math.round(avg)} readonly size={14} />
            <span>{avg.toFixed(1)} ({count})</span>
          </div>
        )}
        <div className="product-card-footer">
          <span className="product-card-price">{formatINR(product.price)}</span>
          <div className="product-card-meta">
            {product.license && <span className="license-badge">{product.license}</span>}
            {product.category && <span className="product-card-category">{product.category}</span>}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import FollowButton from '../components/FollowButton';
import VerifiedBadge from '../components/VerifiedBadge';
import { getUserById, getUserListings, getCreatorStats, getBundlesBySeller } from '../utils/storage';
import { formatINR } from '../utils/validation';
import { Package, TrendingUp } from 'lucide-react';
import './CreatorProfile.css';

export default function CreatorProfile() {
  const { id } = useParams();
  const creator = getUserById(id);
  const products = getUserListings(id);
  const bundles = getBundlesBySeller(id);
  const stats = getCreatorStats(id);

  if (!creator) {
    return (
      <div className="creator-page">
        <Navbar />
        <div className="page-container creator-not-found">
          <h2>Creator not found</h2>
          <Link to="/discover" className="btn btn-primary">Back to Discover</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="creator-page">
      <Navbar />
      <div className="page-container creator-content">
        <motion.div
          className="creator-header card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="creator-avatar">{creator.name.charAt(0)}</div>
          <div className="creator-info">
            <div className="creator-name-row">
              <h1>{creator.name}</h1>
              <VerifiedBadge user={creator} size="lg" />
            </div>
            <p>{creator.bio || 'Indian software creator on Profinder.'}</p>
            <div className="creator-actions">
              <FollowButton creatorId={creator.id} />
              <Link to={`/messages?to=${creator.id}`} className="btn btn-outline">Message</Link>
            </div>
          </div>
          <div className="creator-stats">
            <div><Package size={16} /><strong>{stats.products}</strong><span>Products</span></div>
            <div><TrendingUp size={16} /><strong>{stats.sales}</strong><span>Interests</span></div>
          </div>
        </motion.div>

        {bundles.length > 0 && (
          <>
            <h2 className="creator-products-title">Bundle Offers</h2>
            <div className="creator-bundles">
              {bundles.map((b) => (
                <div key={b.id} className="creator-bundle card">
                  <h3>{b.title}</h3>
                  <p>{b.productIds.length} products bundled together</p>
                  <div className="creator-bundle-price">
                    <strong>{formatINR(b.price)}</strong>
                    <s>{formatINR(b.originalPrice)}</s>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="creator-products-title">Products by {creator.name.split(' ')[0]}</h2>
        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="creator-empty card">
            <p>This creator hasn&apos;t published any products yet.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

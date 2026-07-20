import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import FollowButton from '../components/FollowButton';
import VerifiedBadge from '../components/VerifiedBadge';
import { getCreatorProfile, getUserListings, getCreatorStats, getBundlesBySeller } from '../utils/storage';
import { formatINR } from '../utils/validation';
import { navigateContact } from '../utils/contactActions';
import { useAuth } from '../hooks/useAuth';
import { Package, TrendingUp, Link2, MessageCircle, Settings } from 'lucide-react';
import './CreatorProfile.css';

export default function CreatorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const creator = getCreatorProfile(id);
  const products = getUserListings(id);
  const bundles = getBundlesBySeller(id);
  const stats = getCreatorStats(id);
  const skills = Array.isArray(creator?.skills) ? creator.skills : [];
  const portfolio = Array.isArray(creator?.portfolio) ? creator.portfolio : [];

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
          <div className="creator-avatar">
            {creator.avatar ? <img src={creator.avatar} alt={creator.name} /> : creator.name.charAt(0)}
          </div>
          <div className="creator-info">
            <div className="creator-name-row">
              <h1>{creator.name}</h1>
              <VerifiedBadge user={creator} size="lg" />
            </div>
            <p>{creator.bio || 'Indian software creator on Profinds.'}</p>
            {skills.length > 0 && (
              <div className="creator-skills">
                {skills.map((skill) => (
                  <span key={skill} className="creator-skill">{skill}</span>
                ))}
              </div>
            )}
            <div className="creator-actions">
              <FollowButton creatorId={creator.id} />
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigateContact(navigate, {
                  user,
                  ownerId: creator.id,
                  type: 'profile',
                  id: creator.id,
                  toUserId: creator.id,
                })}
              >
                {user?.id === creator.id ? (
                  <><Settings size={16} /> Manage Profile</>
                ) : (
                  <><MessageCircle size={16} /> Message</>
                )}
              </button>
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

        {portfolio.length > 0 && (
          <>
            <h2 className="creator-products-title">Portfolio</h2>
            <div className="creator-portfolio">
              {portfolio.map((item) => (
                <div key={item.id} className="creator-portfolio-item card">
                  {item.image && <img src={item.image} alt={item.title} className="creator-portfolio-thumb" />}
                  <div className="creator-portfolio-body">
                    <strong>{item.title}</strong>
                    {item.description && <p>{item.description}</p>}
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="creator-portfolio-link">
                        <Link2 size={14} /> View project
                      </a>
                    )}
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

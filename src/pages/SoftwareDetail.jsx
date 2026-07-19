import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FollowButton from '../components/FollowButton';
import SaveButton from '../components/SaveButton';
import ProductCard from '../components/ProductCard';
import ReviewsSection from '../components/ReviewsSection';
import MessageModal from '../components/MessageModal';
import VerifiedBadge from '../components/VerifiedBadge';
import StarRating from '../components/StarRating';
import {
  getSoftwareById,
  getSoftwareListings,
  getUserById,
  trackListingContact,
  getProductRating,
  getBundlesBySeller,
} from '../utils/storage';
import { formatINR, formatIndianPhone } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import { Mail, Phone, ExternalLink, MessageCircle } from 'lucide-react';
import './SoftwareDetail.css';
import '../components/VerifiedBadge.css';

export default function SoftwareDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [software, setSoftware] = useState(() => getSoftwareById(id));
  const [showMessage, setShowMessage] = useState(false);
  const seller = software ? getUserById(software.sellerId) : null;
  const rating = software ? getProductRating(software.id) : { avg: 0, count: 0 };

  useEffect(() => {
    setSoftware(getSoftwareById(id) || null);
  }, [id]);

  if (!software || !seller) {
    return (
      <div className="detail-page">
        <Navbar />
        <div className="page-container detail-not-found">
          <h2>Product not found</h2>
          <Link to="/discover" className="btn btn-primary">Back to Discover</Link>
        </div>
      </div>
    );
  }

  const related = getSoftwareListings()
    .filter((item) => item.id !== software.id && (item.category === software.category || item.sellerId === software.sellerId))
    .slice(0, 4);

  const bundles = getBundlesBySeller(software.sellerId).filter((b) => b.productIds.includes(software.id));
  const isFeatured = software.featured && software.featuredUntil && new Date(software.featuredUntil) > new Date();

  return (
    <div className="detail-page">
      <Navbar />
      <div className="page-container detail-content">
        <div className="detail-layout">
          <motion.div className="detail-main" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="detail-cover card">
              {software.photos?.[0] ? (
                <img src={software.photos[0]} alt={software.title} />
              ) : (
                <div className="detail-cover-placeholder">{software.title.charAt(0)}</div>
              )}
            </div>

            {software.photos?.length > 1 && (
              <div className="detail-thumbs">
                {software.photos.slice(1).map((photo, i) => (
                  <img key={i} src={photo} alt={`${software.title} ${i + 2}`} />
                ))}
              </div>
            )}

            {software.videos?.length > 0 && (
              <div className="detail-videos card">
                <h3>Preview</h3>
                {software.videos.map((video, i) => (
                  <video key={i} src={video} controls className="detail-video" />
                ))}
              </div>
            )}

            <div className="detail-description card">
              <h2>About this product</h2>
              <p>{software.about || software.description}</p>
              <div className="detail-preview-links">
                {software.demoUrl && (
                  <a href={software.demoUrl} target="_blank" rel="noopener noreferrer" className="preview-link">
                    <ExternalLink size={16} /> Live Demo
                  </a>
                )}
                {software.url && (
                  <a href={software.url} target="_blank" rel="noopener noreferrer" className="preview-link">
                    <ExternalLink size={16} /> Website
                  </a>
                )}
              </div>
            </div>

            <ReviewsSection productId={software.id} sellerId={software.sellerId} />
          </motion.div>

          <motion.aside className="detail-sidebar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="detail-purchase card">
              <div className="detail-tags">
                {isFeatured && <span className="featured-tag">⭐ Featured</span>}
                {software.builtWithIndia && <span className="india-tag">🇮🇳 Built With India</span>}
                {software.license && <span className="license-badge">{software.license} License</span>}
              </div>

              <div className="detail-purchase-top">
                <span className="detail-price">{formatINR(software.price)}</span>
                <SaveButton productId={software.id} />
              </div>

              <h1>{software.title}</h1>
              {rating.count > 0 && (
                <div className="detail-rating">
                  <StarRating value={Math.round(rating.avg)} readonly size={14} />
                  <span>{rating.avg} ({rating.count})</span>
                </div>
              )}
              <p className="detail-short">{software.description}</p>

              <Link to={`/creator/${software.sellerId}`} className="detail-creator">
                by {software.sellerName}
              </Link>
              <VerifiedBadge user={seller} />

              {software.category && <span className="detail-category">{software.category}</span>}

              {user && user.id !== software.sellerId ? (
                <button type="button" className="btn btn-primary detail-want-btn" onClick={() => setShowMessage(true)}>
                  <MessageCircle size={18} /> Message Seller
                </button>
              ) : (
                <a href={`mailto:${software.contactEmail}?subject=I want ${software.title}`} className="btn btn-primary detail-want-btn" onClick={() => trackListingContact(software.id)}>
                  I want this
                </a>
              )}

              <div className="detail-contact-row">
                <a href={`mailto:${software.contactEmail}`} className="btn btn-outline" onClick={() => trackListingContact(software.id)}>
                  <Mail size={16} /> Email
                </a>
                <a href={`tel:${software.contactPhone.replace(/\s/g, '')}`} className="btn btn-outline" onClick={() => trackListingContact(software.id)}>
                  <Phone size={16} /> Call
                </a>
              </div>

              <div className="detail-sidebar-meta">
                <FollowButton creatorId={software.sellerId} />
              </div>

              <div className="detail-contact-info">
                <p><strong>Email:</strong> {software.contactEmail}</p>
                <p><strong>Phone:</strong> {formatIndianPhone(software.contactPhone)}</p>
              </div>
            </div>

            {bundles.length > 0 && (
              <div className="detail-bundles card">
                <h3>Available in Bundles</h3>
                {bundles.map((b) => (
                  <div key={b.id} className="bundle-offer">
                    <strong>{b.title}</strong>
                    <p>{formatINR(b.price)} <s>{formatINR(b.originalPrice)}</s></p>
                  </div>
                ))}
              </div>
            )}
          </motion.aside>
        </div>

        {related.length > 0 && (
          <section className="detail-related">
            <h2>More like this</h2>
            <div className="product-grid">
              {related.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      <MessageModal
        isOpen={showMessage}
        onClose={() => setShowMessage(false)}
        seller={seller}
        product={software}
      />

      <Footer />
    </div>
  );
}

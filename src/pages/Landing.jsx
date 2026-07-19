import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CategoryMarquee from '../components/CategoryMarquee';
import ProductCard from '../components/ProductCard';
import { getVisibleListings, getFeaturedListings } from '../utils/storage';
import { ArrowRight, Sparkles } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const featured = useMemo(() => getFeaturedListings(), []);
  const popular = useMemo(() => getVisibleListings().slice(0, 8), []);

  return (
    <div className="landing">
      <Navbar variant="transparent" />

      <section className="hero">
        <div className="page-container hero-inner">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="badge hero-badge">🇮🇳 Made for India</span>
            <h1 className="hero-title">
              Build it once.
              <br />
              <span className="gradient-text">Sell it everywhere in India</span>
            </h1>
            <p className="hero-subtitle">
              Profinder helps Indian developers sell code, templates, and digital products.
              List once, get discovered, and connect with buyers directly.
            </p>
          </motion.div>

          <motion.div
            className="hero-actions-side"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link to="/discover" className="btn btn-primary hero-btn">
              Discover Products
              <ArrowRight size={18} />
            </Link>
            <Link to="/signup" className="btn btn-outline hero-btn">
              Start Selling
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="gumroad-section">
        <div className="page-container">
          <CategoryMarquee />
        </div>
      </section>

      {featured.length > 0 && (
        <section className="gumroad-section featured-section">
          <div className="page-container">
            <div className="gumroad-section-header">
              <div>
                <h2><Sparkles size={22} className="inline-icon" /> Featured Listings</h2>
                <p>Top products promoted by verified creators</p>
              </div>
              <Link to="/discover" className="btn btn-outline">View all</Link>
            </div>
            <div className="product-grid">
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="gumroad-section">
        <div className="page-container">
          <div className="gumroad-section-header">
            <div>
              <h2>Discover best-selling products</h2>
              <p>Explore software from creators across India</p>
            </div>
            <Link to="/discover" className="btn btn-outline">View all</Link>
          </div>
          {popular.length > 0 ? (
            <div className="product-grid">
              {popular.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div className="landing-empty card">
              <p>No products yet. Be the first creator on Profinder.</p>
              <Link to="/signup" className="btn btn-primary">Start Selling</Link>
            </div>
          )}
        </div>
      </section>

      <section className="cta-section">
        <motion.div
          className="page-container cta-inner card"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2>Share your work. Someone out there needs it.</h2>
          <p>Publish your software and start selling today.</p>
          <Link to="/signup" className="btn btn-primary">
            Start selling
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

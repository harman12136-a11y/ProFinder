import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CategoryMarquee from '../components/CategoryMarquee';
import ProductCard from '../components/ProductCard';
import LandingPaths from '../components/LandingPaths';
import { getFeaturedListings } from '../utils/storage';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Landing.css';

export default function Landing() {
  const { user } = useAuth();
  const featured = useMemo(() => getFeaturedListings(), []);

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
            <Link to={user ? '/discover' : '/login'} className="btn btn-primary hero-btn">
              Discover Products
              <ArrowRight size={18} />
            </Link>
            <Link to={user ? '/list-software' : '/signup'} className="btn btn-outline hero-btn">
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

      <LandingPaths />

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

      <Footer />
    </div>
  );
}

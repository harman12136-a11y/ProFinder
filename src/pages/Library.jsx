import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../hooks/useAuth';
import { getSavedListings, getFollowedListings } from '../utils/storage';
import { Heart, Users } from 'lucide-react';
import './Library.css';

export default function Library() {
  const { user } = useAuth();
  const saved = useMemo(() => getSavedListings(user.id), [user.id]);
  const following = useMemo(() => getFollowedListings(user.id), [user.id]);

  return (
    <div className="library-page">
      <Navbar />
      <div className="page-container library-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-title">Your <span className="gradient-text">Library</span></h1>
          <p className="section-subtitle">Saved products and updates from creators you follow.</p>

          <section className="library-section">
            <div className="library-section-header">
              <Heart size={20} />
              <h2>Saved Products</h2>
              <span>{saved.length}</span>
            </div>
            {saved.length > 0 ? (
              <div className="product-grid">
                {saved.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            ) : (
              <div className="library-empty card">
                <p>No saved products yet.</p>
                <Link to="/discover" className="btn btn-outline">Browse Discover</Link>
              </div>
            )}
          </section>

          <section className="library-section">
            <div className="library-section-header">
              <Users size={20} />
              <h2>From Creators You Follow</h2>
              <span>{following.length}</span>
            </div>
            {following.length > 0 ? (
              <div className="product-grid">
                {following.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            ) : (
              <div className="library-empty card">
                <p>Follow creators to see their latest products here.</p>
                <Link to="/discover" className="btn btn-outline">Explore Creators</Link>
              </div>
            )}
          </section>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

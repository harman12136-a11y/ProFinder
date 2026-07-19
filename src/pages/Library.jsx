import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../hooks/useAuth';
import { getSavedListings, getFollowedListings } from '../utils/storage';
import { Heart, Users, Settings } from 'lucide-react';
import './Library.css';

const TABS = [
  { id: 'saved', label: 'Saved Products', icon: Heart },
  { id: 'following', label: 'Following', icon: Users },
];

export default function Library() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('saved');
  const saved = useMemo(() => getSavedListings(user.id), [user.id]);
  const following = useMemo(() => getFollowedListings(user.id), [user.id]);

  const counts = { saved: saved.length, following: following.length };
  const items = activeTab === 'saved' ? saved : following;

  return (
    <div className="library-page">
      <Navbar />
      <div className="library-layout">
        <aside className="library-sidebar">
          <nav className="library-nav">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`library-nav-item${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={18} />
                <span>{label}</span>
                <span className="library-nav-count">{counts[id]}</span>
              </button>
            ))}
          </nav>

          <Link to="/settings" className="library-account">
            <div className="library-account-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
            </div>
            <span className="library-account-name">{user.name}</span>
            <Settings size={18} className="library-account-settings" />
          </Link>
        </aside>

        <main className="library-main">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="library-main-header">
              <h1>{activeTab === 'saved' ? 'Saved Products' : 'From Creators You Follow'}</h1>
              <p>
                {activeTab === 'saved'
                  ? 'Products you bookmarked for later.'
                  : 'Latest products from creators you follow.'}
              </p>
            </div>

            {items.length > 0 ? (
              <div className="product-grid library-grid">
                {items.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            ) : (
              <div className="library-empty">
                {activeTab === 'saved' ? <Heart size={40} /> : <Users size={40} />}
                <h3>{activeTab === 'saved' ? 'No saved products yet' : 'Nothing from followed creators'}</h3>
                <p>
                  {activeTab === 'saved'
                    ? 'Save products from Discover to find them here.'
                    : 'Follow creators to see their latest products.'}
                </p>
                <Link to="/discover" className="btn btn-primary">
                  {activeTab === 'saved' ? 'Browse Discover' : 'Explore Creators'}
                </Link>
              </div>
            )}
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

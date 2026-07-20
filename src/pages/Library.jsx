import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import PurchaseCard from '../components/PurchaseCard';
import { useAuth } from '../hooks/useAuth';
import {
  getSavedListings,
  getFollowedListings,
  getPurchaseLibrary,
  removePurchase,
} from '../utils/storage';
import { Heart, Users, Settings, ShoppingBag, Search } from 'lucide-react';
import './Library.css';

const TABS = [
  { id: 'purchases', label: 'My Purchases', icon: ShoppingBag },
  { id: 'saved', label: 'Saved Products', icon: Heart },
  { id: 'following', label: 'Following', icon: Users },
];

const PURCHASE_SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'price-low', label: 'Price: low to high' },
];

export default function Library() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseSort, setPurchaseSort] = useState('newest');
  const [purchases, setPurchases] = useState(() => getPurchaseLibrary(user.id));

  const saved = useMemo(() => getSavedListings(user.id), [user.id]);
  const following = useMemo(() => getFollowedListings(user.id), [user.id]);

  useEffect(() => {
    setPurchases(getPurchaseLibrary(user.id));
  }, [user.id]);

  const filteredPurchases = useMemo(() => {
    const query = purchaseSearch.trim().toLowerCase();
    let items = purchases;

    if (query) {
      items = items.filter(({ purchase, product }) => {
        const haystack = [
          purchase.productTitle,
          purchase.sellerName,
          product?.category,
          product?.description,
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    return [...items].sort((a, b) => {
      if (purchaseSort === 'oldest') {
        return new Date(a.purchase.purchasedAt) - new Date(b.purchase.purchasedAt);
      }
      if (purchaseSort === 'price-high') return b.purchase.price - a.purchase.price;
      if (purchaseSort === 'price-low') return a.purchase.price - b.purchase.price;
      return new Date(b.purchase.purchasedAt) - new Date(a.purchase.purchasedAt);
    });
  }, [purchases, purchaseSearch, purchaseSort]);

  const counts = {
    purchases: purchases.length,
    saved: saved.length,
    following: following.length,
  };

  const handleRemovePurchase = (purchaseId) => {
    if (!window.confirm('Remove this purchase from your library?')) return;
    removePurchase(user.id, purchaseId);
    setPurchases(getPurchaseLibrary(user.id));
  };

  const tabCopy = {
    purchases: {
      title: 'My Purchases',
      description: 'Products you bought — access downloads and manage your library.',
    },
    saved: {
      title: 'Saved Products',
      description: 'Products you bookmarked for later.',
    },
    following: {
      title: 'From Creators You Follow',
      description: 'Latest products from creators you follow.',
    },
  };

  const { title, description } = tabCopy[activeTab];
  const savedOrFollowing = activeTab === 'saved' ? saved : following;

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
              <h1>{title}</h1>
              <p>{description}</p>
            </div>

            {activeTab === 'purchases' && (
              <>
                <div className="library-toolbar">
                  <div className="library-search">
                    <Search size={16} />
                    <input
                      type="search"
                      placeholder="Search purchases..."
                      value={purchaseSearch}
                      onChange={(e) => setPurchaseSearch(e.target.value)}
                      aria-label="Search purchases"
                    />
                  </div>
                  <select
                    className="library-sort"
                    value={purchaseSort}
                    onChange={(e) => setPurchaseSort(e.target.value)}
                    aria-label="Sort purchases"
                  >
                    {PURCHASE_SORTS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {filteredPurchases.length > 0 ? (
                  <div className="purchase-list">
                    {filteredPurchases.map(({ purchase, product }) => (
                      <PurchaseCard
                        key={purchase.id}
                        purchase={purchase}
                        product={product}
                        onRemove={handleRemovePurchase}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="library-empty">
                    <ShoppingBag size={40} />
                    <h3>
                      {purchaseSearch ? 'No matching purchases' : 'No purchases yet'}
                    </h3>
                    <p>
                      {purchaseSearch
                        ? 'Try a different search term.'
                        : 'Buy products from Discover to build your purchase library.'}
                    </p>
                    {!purchaseSearch && (
                      <Link to="/discover" className="btn btn-primary">Browse Discover</Link>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab !== 'purchases' && (
              savedOrFollowing.length > 0 ? (
                <div className="product-grid library-grid">
                  {savedOrFollowing.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>
              ) : (
                <div className="library-empty">
                  {activeTab === 'saved' ? <Heart size={40} /> : <Users size={40} />}
                  <h3>
                    {activeTab === 'saved' ? 'No saved products yet' : 'Nothing from followed creators'}
                  </h3>
                  <p>
                    {activeTab === 'saved'
                      ? 'Save products from Discover to find them here.'
                      : 'Follow creators to see their latest products.'}
                  </p>
                  <Link to="/discover" className="btn btn-primary">
                    {activeTab === 'saved' ? 'Browse Discover' : 'Explore Creators'}
                  </Link>
                </div>
              )
            )}
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

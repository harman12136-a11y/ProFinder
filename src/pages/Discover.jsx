import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import CategoryPills from '../components/CategoryPills';
import { getVisibleListings } from '../utils/storage';
import { filterListings, sortListings, SORT_OPTIONS } from '../utils/categories';
import { recommendListings } from '../utils/recommend';
import { useAuth } from '../hooks/useAuth';
import './Discover.css';

export default function Discover() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    setListings(getVisibleListings());
  }, []);

  const filtered = useMemo(() => {
    const items = filterListings(listings, { search, category });
    return sortListings(items, sortBy);
  }, [listings, search, category, sortBy]);

  const recommended = useMemo(
    () => recommendListings(listings, user).slice(0, 4),
    [listings, user]
  );

  const hasFilters = search || category !== 'all';

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setSortBy('newest');
  };

  return (
    <div className="discover-page">
      <Navbar />
      <div className="discover-layout">
        <aside className="discover-sidebar">
          <div className="discover-sidebar-filters">
            <h3>Filters</h3>

            <div className="sidebar-filter-group">
              <label htmlFor="discover-search">Search</label>
              <div className="sidebar-search">
                <Search size={16} />
                <input
                  id="discover-search"
                  type="text"
                  placeholder="Products, creators..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="sidebar-filter-group">
              <label htmlFor="discover-sort">Sort By</label>
              <select id="discover-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <p className="discover-count">{filtered.length} product{filtered.length === 1 ? '' : 's'}</p>

            {hasFilters && (
              <button type="button" className="btn btn-ghost sidebar-clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </aside>

        <main className="discover-main">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="discover-main-header">
              <h1>Discover</h1>
              <p>Find software, code, and digital products from Indian creators.</p>
            </div>

            {recommended.length > 0 && !hasFilters && (
              <div className="reco-section">
                <div className="reco-head">
                  <Sparkles size={18} />
                  <h2>Recommended for you</h2>
                </div>
                <div className="product-grid discover-grid">
                  {recommended.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>
              </div>
            )}

            <CategoryPills active={category} onChange={setCategory} />

            {filtered.length > 0 ? (
              <div className="product-grid discover-grid">
                {filtered.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            ) : (
              <div className="discover-empty">
                <p>{hasFilters ? 'No products match your filters.' : 'No products yet. Be the first creator to publish.'}</p>
              </div>
            )}
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

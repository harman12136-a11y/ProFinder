import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import CategoryPills from '../components/CategoryPills';
import CategoryMarquee from '../components/CategoryMarquee';
import { getVisibleListings } from '../utils/storage';
import { filterListings, sortListings, SORT_OPTIONS } from '../utils/categories';
import './Discover.css';

export default function Discover() {
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

  return (
    <div className="discover-page">
      <Navbar />
      <div className="page-container discover-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="discover-hero">
            <h1>Discover</h1>
            <p>Find software, code, and digital products from Indian creators.</p>
          </div>

          <CategoryMarquee />

          <div className="discover-toolbar">
            <div className="discover-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search products, creators, categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="discover-sort">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <CategoryPills active={category} onChange={setCategory} />

          {filtered.length > 0 ? (
            <div className="product-grid discover-grid">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div className="discover-empty card">
              <p>{search || category !== 'all' ? 'No products match your filters.' : 'No products yet. Be the first creator to publish.'}</p>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

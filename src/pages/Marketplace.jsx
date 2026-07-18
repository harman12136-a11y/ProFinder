import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SoftwareCard from '../components/SoftwareCard';
import { getSoftwareListings } from '../utils/storage';
import { Search } from 'lucide-react';
import './Marketplace.css';

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setListings(getSoftwareListings());
  }, []);

  const filtered = listings.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.sellerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="marketplace-page">
      <Navbar />

      <div className="page-container marketplace-content">
        <motion.div
          className="marketplace-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="section-title">
            Software <span className="gradient-text">Marketplace</span>
          </h1>
          <p className="section-subtitle">
            Browse code and software from Indian developers. Contact sellers directly to purchase.
          </p>
        </motion.div>

        <div className="marketplace-search">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search software, code, developers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length > 0 ? (
          <div className="marketplace-grid">
            {filtered.map((software, i) => (
              <SoftwareCard key={software.id} software={software} index={i} />
            ))}
          </div>
        ) : (
          <motion.div
            className="marketplace-empty card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>{search ? 'No results found for your search.' : 'No software listed yet. Be the first to list!'}</p>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}

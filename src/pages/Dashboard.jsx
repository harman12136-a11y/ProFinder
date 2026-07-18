import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { getUserListings } from '../utils/storage';
import { formatINR } from '../utils/validation';
import { Plus, Package } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const listings = getUserListings(user.id);

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="page-container dashboard-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="dashboard-header">
            <div>
              <h1 className="section-title">
                Hello, <span className="gradient-text">{user.name.split(' ')[0]}</span>
              </h1>
              <p className="section-subtitle">Manage your software listings</p>
            </div>
            <Link to="/list-software" className="btn btn-primary">
              <Plus size={18} /> New Listing
            </Link>
          </div>

          <div className="dashboard-stats">
            <div className="dashboard-stat card">
              <Package size={24} />
              <div>
                <span className="stat-num">{listings.length}</span>
                <span className="stat-text">Active Listings</span>
              </div>
            </div>
          </div>

          <h2 className="dashboard-section-title">Your Listings</h2>

          {listings.length > 0 ? (
            <div className="dashboard-listings">
              {listings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  className="dashboard-listing card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="dashboard-listing-info">
                    {listing.photos?.[0] ? (
                      <img src={listing.photos[0]} alt={listing.title} className="dashboard-listing-thumb" />
                    ) : (
                      <div className="dashboard-listing-placeholder">{listing.title.charAt(0)}</div>
                    )}
                    <div>
                      <h3>{listing.title}</h3>
                      <p>{listing.description.slice(0, 80)}...</p>
                      <span className="dashboard-listing-price">{formatINR(listing.price)}</span>
                    </div>
                  </div>
                  <Link to={`/software/${listing.id}`} className="btn btn-outline">
                    View
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty card">
              <Package size={48} />
              <h3>No listings yet</h3>
              <p>List your first software and reach buyers across India</p>
              <Link to="/list-software" className="btn btn-primary">
                <Plus size={18} /> List Software
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

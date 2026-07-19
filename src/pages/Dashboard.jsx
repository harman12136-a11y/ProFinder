import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FeatureModal from '../components/FeatureModal';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../hooks/useAuth';
import {
  getUserListings, deleteSoftwareListing,
  featureListing, getBundlesBySeller, deleteBundle,
  getServiceByUserId, isSubscriptionActive, renewSubscription,
} from '../utils/storage';
import { formatINR } from '../utils/validation';
import { FEATURE_DAYS, SERVICE_MONTHLY_FEE } from '../utils/constants';
import { Plus, Package, Settings, Pencil, Trash2, Sparkles, Briefcase } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState(() => getUserListings(user.id));
  const [bundles, setBundles] = useState(() => getBundlesBySeller(user.id));
  const [featureTarget, setFeatureTarget] = useState(null);
  const [showRenew, setShowRenew] = useState(false);
  const [service, setService] = useState(() => getServiceByUserId(user.id));
  const subscriptionActive = isSubscriptionActive(user.id);

  const refresh = () => {
    setListings(getUserListings(user.id));
    setBundles(getBundlesBySeller(user.id));
    setService(getServiceByUserId(user.id));
  };

  const handleDelete = (listing) => {
    if (!window.confirm(`Delete "${listing.title}"?`)) return;
    deleteSoftwareListing(listing.id);
    refresh();
  };

  const handleFeature = (listing) => setFeatureTarget(listing);

  const handleFeatureSuccess = () => {
    featureListing(featureTarget.id, FEATURE_DAYS);
    refresh();
    setFeatureTarget(null);
  };

  const handleRenewSuccess = () => {
    const updated = renewSubscription(user.id);
    if (updated) updateUser({ subscriptionExpiresAt: updated.subscriptionExpiresAt });
    refresh();
    setShowRenew(false);
  };

  const isFeatured = (l) => l.featured && l.featuredUntil && new Date(l.featuredUntil) > new Date();

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="page-container dashboard-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="dashboard-header">
            <div>
              <h1 className="section-title">Manage <span className="gradient-text">Listings</span></h1>
              <p className="section-subtitle">Edit, feature, and bundle your products &amp; services</p>
            </div>
            <div className="dashboard-header-actions">
              <Link to="/settings" className="btn btn-outline"><Settings size={18} /> Profile</Link>
              <Link to="/create-bundle" className="btn btn-outline">Create Bundle</Link>
              <Link to="/list-software" className="btn btn-primary"><Plus size={18} /> New Product</Link>
            </div>
          </div>

          <div className="dashboard-panel card subscription-panel">
            <h2>Platform Subscription</h2>
            <p>
              Status:{' '}
              <strong className={subscriptionActive ? 'status-active' : 'status-inactive'}>
                {subscriptionActive ? 'Active' : 'Inactive'}
              </strong>
            </p>
            {user.subscriptionExpiresAt && (
              <p className="service-expiry">
                {subscriptionActive
                  ? `Products & services listed until ${new Date(user.subscriptionExpiresAt).toLocaleDateString('en-IN')}`
                  : 'Your listings are hidden until you renew'}
              </p>
            )}
            {!subscriptionActive && (
              <button type="button" className="btn btn-primary" onClick={() => setShowRenew(true)}>
                Renew — {formatINR(SERVICE_MONTHLY_FEE)}/month
              </button>
            )}
            {subscriptionActive && (
              <button type="button" className="btn btn-outline" onClick={() => setShowRenew(true)}>
                Extend — {formatINR(SERVICE_MONTHLY_FEE)}/month
              </button>
            )}
          </div>

          <div className="dashboard-panel card service-panel">
            <div className="dashboard-panel-header">
              <h2><Briefcase size={18} /> Professional Services</h2>
              {service ? (
                <Link to={`/service/${service.userId}`} className="btn btn-outline">View Profile</Link>
              ) : (
                <Link to="/register-service" className="btn btn-primary">Register as Professional</Link>
              )}
            </div>
            {service ? (
              <p className="service-hint">
                Your professional profile is {subscriptionActive ? 'live on the services page.' : 'registered but hidden — renew subscription to go live.'}
              </p>
            ) : (
              <p className="service-hint">
                Register as a C.A., developer, tax consultant, astrologer, or other professional.
                {formatINR(100)} includes 1 month of active listing for products &amp; services.
              </p>
            )}
          </div>

          <div className="dashboard-panel card">
            <div className="dashboard-panel-header">
              <h2>Your Listings</h2>
              <Link to={`/creator/${user.id}`} className="btn btn-outline">View Storefront</Link>
            </div>
            {listings.length > 0 ? (
              <div className="dashboard-listings">
                {listings.map((listing, i) => (
                  <motion.div key={listing.id} className="dashboard-listing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <div className="dashboard-listing-info">
                      {listing.photos?.[0] ? (
                        <img src={listing.photos[0]} alt={listing.title} className="dashboard-listing-thumb" />
                      ) : (
                        <div className="dashboard-listing-placeholder">{listing.title.charAt(0)}</div>
                      )}
                      <div>
                        <h3>{listing.title} {isFeatured(listing) && <span className="featured-tag">Featured</span>}</h3>
                        <p>{listing.description.slice(0, 90)}...</p>
                        <div className="dashboard-listing-meta">
                          <span>{formatINR(listing.price)}</span>
                          {!subscriptionActive && <span className="listing-hidden">Hidden — renew subscription</span>}
                        </div>
                      </div>
                    </div>
                    <div className="dashboard-listing-actions">
                      <button type="button" className="btn btn-outline" onClick={() => navigate(`/software/${listing.id}`)}>View</button>
                      <Link to={`/edit-software/${listing.id}`} className="btn btn-outline"><Pencil size={16} /> Edit</Link>
                      {!isFeatured(listing) && (
                        <button type="button" className="btn btn-outline" onClick={() => handleFeature(listing)}><Sparkles size={16} /> Feature</button>
                      )}
                      <button type="button" className="btn btn-outline dashboard-delete" onClick={() => handleDelete(listing)}><Trash2 size={16} /> Delete</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                <Package size={48} />
                <h3>No listings yet</h3>
                <Link to="/list-software" className="btn btn-primary"><Plus size={18} /> Create Product</Link>
              </div>
            )}
          </div>

          {bundles.length > 0 && (
            <div className="dashboard-panel card">
              <h2>Your Bundles</h2>
              {bundles.map((b) => (
                <div key={b.id} className="dashboard-listing">
                  <div>
                    <h3>{b.title}</h3>
                    <p>{b.productIds.length} products — {formatINR(b.price)} <s>{formatINR(b.originalPrice)}</s></p>
                  </div>
                  <button type="button" className="btn btn-outline dashboard-delete" onClick={() => { deleteBundle(b.id); refresh(); }}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <FeatureModal
        isOpen={!!featureTarget}
        onClose={() => setFeatureTarget(null)}
        onSuccess={handleFeatureSuccess}
        productTitle={featureTarget?.title}
      />

      <PaymentModal
        isOpen={showRenew}
        onClose={() => setShowRenew(false)}
        onSuccess={handleRenewSuccess}
        amount={SERVICE_MONTHLY_FEE}
        title="Monthly Subscription"
        description="Keep your products and professional profile active for 30 days"
        successText="Subscription renewed!"
      />

      <Footer />
    </div>
  );
}

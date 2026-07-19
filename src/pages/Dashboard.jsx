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
  isSubscriptionActive, renewSubscription,
  getJobsByPoster, getProposalsByFreelancer, getProposalCount,
  getJobById, closeJob, deleteJob,
} from '../utils/storage';
import { formatINR } from '../utils/validation';
import { FEATURE_DAYS, SERVICE_MONTHLY_FEE } from '../utils/constants';
import { Plus, Package, Settings, Pencil, Trash2, Sparkles, Briefcase, Users, Lock, FileText } from 'lucide-react';
import './Dashboard.css';

const TABS = [
  { id: 'listings', label: 'My Listings', icon: Package },
  { id: 'jobs', label: 'Jobs Posted', icon: Briefcase },
  { id: 'proposals', label: 'Proposals', icon: FileText },
];

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('listings');
  const [listings, setListings] = useState(() => getUserListings(user.id));
  const [bundles, setBundles] = useState(() => getBundlesBySeller(user.id));
  const [featureTarget, setFeatureTarget] = useState(null);
  const [showRenew, setShowRenew] = useState(false);
  const [postedJobs, setPostedJobs] = useState(() => getJobsByPoster(user.id));
  const [myProposals, setMyProposals] = useState(() => getProposalsByFreelancer(user.id));
  const subscriptionActive = isSubscriptionActive(user.id);

  const refresh = () => {
    setListings(getUserListings(user.id));
    setBundles(getBundlesBySeller(user.id));
    setPostedJobs(getJobsByPoster(user.id));
    setMyProposals(getProposalsByFreelancer(user.id));
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

  const handleCloseJob = (jobId) => {
    closeJob(jobId);
    refresh();
  };

  const handleDeleteJob = (jobId) => {
    if (!window.confirm('Delete this job and all its proposals?')) return;
    deleteJob(jobId);
    refresh();
  };

  const jobStatusLabel = (status) => (status === 'open' ? 'Open' : status === 'in-progress' ? 'Hired' : 'Closed');
  const proposalStatusLabel = (status) => ({ pending: 'Pending', accepted: 'Hired', rejected: 'Not selected', withdrawn: 'Withdrawn' }[status] || status);

  const tabActions = {
    listings: (
      <>
        <Link to={`/creator/${user.id}`} className="btn btn-outline">View Storefront</Link>
        <Link to="/list-software" className="btn btn-primary"><Plus size={18} /> New Product</Link>
      </>
    ),
    jobs: <Link to="/post-job" className="btn btn-primary"><Plus size={18} /> Post a Job</Link>,
    proposals: <Link to="/jobs" className="btn btn-primary">Find Jobs</Link>,
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav className="dashboard-nav">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`dashboard-nav-item${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>

          <Link to="/settings" className="dashboard-account">
            <div className="dashboard-account-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
            </div>
            <span className="dashboard-account-name">{user.name}</span>
            <Settings size={18} className="dashboard-account-settings" />
          </Link>
        </aside>

        <main className="dashboard-main">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="dashboard-main-header">
              <h1>{TABS.find((t) => t.id === activeTab)?.label}</h1>
              <div className="dashboard-main-actions">{tabActions[activeTab]}</div>
            </div>

            {!subscriptionActive && activeTab === 'listings' && (
              <div className="dashboard-banner">
                <p>Your listings are hidden — subscription inactive.</p>
                <button type="button" className="btn btn-primary" onClick={() => setShowRenew(true)}>
                  Renew — {formatINR(SERVICE_MONTHLY_FEE)}/month
                </button>
              </div>
            )}

            {activeTab === 'listings' && (
              <>
                {listings.length > 0 ? (
                  <div className="dashboard-listings">
                    {listings.map((listing, i) => (
                      <motion.div key={listing.id} className="dashboard-listing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
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
                              {!subscriptionActive && <span className="listing-hidden">Hidden</span>}
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
                    <Package size={40} />
                    <h3>No listings yet</h3>
                    <Link to="/list-software" className="btn btn-primary"><Plus size={18} /> Create Product</Link>
                  </div>
                )}

                {bundles.length > 0 && (
                  <div className="dashboard-bundles">
                    <h2>Bundles</h2>
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
              </>
            )}

            {activeTab === 'jobs' && (
              postedJobs.length > 0 ? (
                <div className="dashboard-listings">
                  {postedJobs.map((job) => {
                    const count = getProposalCount(job.id);
                    return (
                      <div key={job.id} className="dashboard-listing">
                        <div className="dashboard-listing-info">
                          <div className="dashboard-listing-placeholder"><Briefcase size={22} /></div>
                          <div>
                            <h3>{job.title} <span className={`job-card-status status-${job.status}`}>{jobStatusLabel(job.status)}</span></h3>
                            <p>{job.description.slice(0, 80)}...</p>
                            <div className="dashboard-listing-meta">
                              <span>{job.budgetType === 'hourly' ? `${formatINR(job.budget)}/hr` : formatINR(job.budget)}</span>
                              <span>{count} proposal{count === 1 ? '' : 's'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="dashboard-listing-actions">
                          <Link to={`/job/${job.id}`} className="btn btn-outline"><Users size={16} /> View{count > 0 ? ` (${count})` : ''}</Link>
                          {job.status === 'open' && (
                            <button type="button" className="btn btn-outline" onClick={() => handleCloseJob(job.id)}><Lock size={16} /> Close</button>
                          )}
                          <button type="button" className="btn btn-outline dashboard-delete" onClick={() => handleDeleteJob(job.id)}><Trash2 size={16} /> Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="dashboard-empty">
                  <Briefcase size={40} />
                  <h3>No jobs posted yet</h3>
                  <Link to="/post-job" className="btn btn-primary"><Plus size={18} /> Post a Job</Link>
                </div>
              )
            )}

            {activeTab === 'proposals' && (
              myProposals.length > 0 ? (
                <div className="dashboard-listings">
                  {myProposals.map((p) => {
                    const job = getJobById(p.jobId);
                    if (!job) return null;
                    return (
                      <div key={p.id} className="dashboard-listing">
                        <div className="dashboard-listing-info">
                          <div className="dashboard-listing-placeholder"><FileText size={22} /></div>
                          <div>
                            <h3>{job.title} <span className={`proposal-status ps-${p.status}`}>{proposalStatusLabel(p.status)}</span></h3>
                            <p>{p.coverLetter.slice(0, 80)}...</p>
                            <div className="dashboard-listing-meta">
                              <span>Your bid: {formatINR(p.bidAmount)}</span>
                              <span>{p.timeline}</span>
                            </div>
                          </div>
                        </div>
                        <div className="dashboard-listing-actions">
                          <Link to={`/job/${job.id}`} className="btn btn-outline">View Job</Link>
                          {p.status === 'accepted' && (
                            <Link to={`/messages?to=${job.posterId}`} className="btn btn-primary">Message Client</Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="dashboard-empty">
                  <FileText size={40} />
                  <h3>No proposals yet</h3>
                  <Link to="/jobs" className="btn btn-primary">Find Jobs</Link>
                </div>
              )
            )}
          </motion.div>
        </main>
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

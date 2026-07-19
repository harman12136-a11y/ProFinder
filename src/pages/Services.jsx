import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';
import { getActiveServices } from '../utils/storage';
import { SERVICE_PROFESSIONS } from '../utils/constants';
import { recommendServices } from '../utils/recommend';
import { useAuth } from '../hooks/useAuth';
import './Services.css';
import '../components/ServiceCard.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

export default function Services() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [profession, setProfession] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const services = useMemo(() => getActiveServices(), []);

  const recommended = useMemo(
    () => recommendServices(services, user).slice(0, 3),
    [services, user]
  );

  const filtered = useMemo(() => {
    let items = services.filter((s) => {
      const matchProfession = profession === 'all' || s.profession === profession;
      const q = search.toLowerCase();
      const matchSearch = !q
        || s.name?.toLowerCase().includes(q)
        || s.bio?.toLowerCase().includes(q)
        || s.degree?.toLowerCase().includes(q)
        || s.achievements?.toLowerCase().includes(q);
      return matchProfession && matchSearch;
    });

    items = [...items];
    if (sortBy === 'oldest') {
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return items;
  }, [services, search, profession, sortBy]);

  const hasFilters = search || profession !== 'all';

  const clearFilters = () => {
    setSearch('');
    setProfession('all');
    setSortBy('newest');
  };

  return (
    <div className="services-page">
      <Navbar />
      <div className="services-layout">
        <aside className="services-sidebar">
          <div className="services-sidebar-filters">
            <h3>Filters</h3>

            <div className="sidebar-filter-group">
              <label htmlFor="services-search">Search</label>
              <div className="sidebar-search">
                <Search size={16} />
                <input
                  id="services-search"
                  type="text"
                  placeholder="Name, skill, degree..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="sidebar-filter-group">
              <label htmlFor="services-sort">Sort By</label>
              <select id="services-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <p className="services-count">{filtered.length} professional{filtered.length === 1 ? '' : 's'}</p>

            {hasFilters && (
              <button type="button" className="btn btn-ghost sidebar-clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          {user && (
            <Link to="/register-service" className="btn btn-primary services-sidebar-cta">
              Register as Professional
            </Link>
          )}
        </aside>

        <main className="services-main">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="services-main-header">
              <h1>Professional <span className="gradient-text">Services</span></h1>
              <p>Find verified C.A.s, developers, tax consultants, astrologers, and digital service providers across India.</p>
            </div>

            {recommended.length > 0 && !hasFilters && (
              <div className="reco-section">
                <div className="reco-head">
                  <Sparkles size={18} />
                  <h2>Professionals for your interests</h2>
                </div>
                <div className="services-grid">
                  {recommended.map((service, i) => (
                    <ServiceCard key={service.id} service={service} index={i} />
                  ))}
                </div>
              </div>
            )}

            <div className="services-filters">
              <button
                type="button"
                className={`services-filter-btn ${profession === 'all' ? 'active' : ''}`}
                onClick={() => setProfession('all')}
              >
                All
              </button>
              {SERVICE_PROFESSIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`services-filter-btn ${profession === p.value ? 'active' : ''}`}
                  onClick={() => setProfession(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {filtered.length > 0 ? (
              <div className="services-grid">
                {filtered.map((service, i) => (
                  <ServiceCard key={service.id} service={service} index={i} />
                ))}
              </div>
            ) : (
              <div className="services-empty">
                <h3>No professionals found</h3>
                <p>Be the first to register on Profinder.</p>
                {user ? (
                  <Link to="/register-service" className="btn btn-primary">Register Now</Link>
                ) : (
                  <Link to="/signup" className="btn btn-primary">Sign Up to Register</Link>
                )}
              </div>
            )}
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

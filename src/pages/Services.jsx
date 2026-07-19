import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';
import { getActiveServices } from '../utils/storage';
import { SERVICE_PROFESSIONS } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import './Services.css';
import '../components/ServiceCard.css';

export default function Services() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [profession, setProfession] = useState('all');
  const services = useMemo(() => getActiveServices(), []);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchProfession = profession === 'all' || s.profession === profession;
      const q = search.toLowerCase();
      const matchSearch = !q
        || s.name?.toLowerCase().includes(q)
        || s.bio?.toLowerCase().includes(q)
        || s.degree?.toLowerCase().includes(q)
        || s.achievements?.toLowerCase().includes(q);
      return matchProfession && matchSearch;
    });
  }, [services, search, profession]);

  return (
    <div className="services-page">
      <Navbar />
      <div className="page-container services-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="services-hero">
            <h1>Professional <span className="gradient-text">Services</span></h1>
            <p>Find verified C.A.s, developers, tax consultants, astrologers, and digital service providers across India.</p>
            {user && (
              <Link to="/register-service" className="btn btn-primary">Register as Professional</Link>
            )}
          </div>

          <div className="services-toolbar">
            <div className="discover-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by name, skill, degree..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

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
            <div className="services-empty card">
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
      </div>
      <Footer />
    </div>
  );
}

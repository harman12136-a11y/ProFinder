import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Briefcase, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import JobCard from '../components/JobCard';
import { getOpenJobs, getProposalCount } from '../utils/storage';
import { JOB_CATEGORIES, JOB_SORT_OPTIONS, JOB_BUDGET_TYPES } from '../utils/constants';
import { recommendJobs } from '../utils/recommend';
import { useAuth } from '../hooks/useAuth';
import './Jobs.css';

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [budgetType, setBudgetType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    setJobs(getOpenJobs());
  }, []);

  const filtered = useMemo(() => {
    let items = jobs.filter((job) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || [
        job.title, job.description, job.category, job.posterName,
        ...(job.skills || []),
      ].join(' ').toLowerCase().includes(q);
      const matchesCategory = category === 'all' || job.category === category;
      const matchesBudget = budgetType === 'all' || job.budgetType === budgetType;
      return matchesSearch && matchesCategory && matchesBudget;
    });

    items = [...items];
    switch (sortBy) {
      case 'budget-high': items.sort((a, b) => b.budget - a.budget); break;
      case 'budget-low': items.sort((a, b) => a.budget - b.budget); break;
      case 'proposals': items.sort((a, b) => getProposalCount(a.id) - getProposalCount(b.id)); break;
      default: items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return items;
  }, [jobs, search, category, budgetType, sortBy]);

  const recommended = useMemo(
    () => recommendJobs(jobs, user).slice(0, 3),
    [jobs, user]
  );

  const hasFilters = search || category !== 'all' || budgetType !== 'all';

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setBudgetType('all');
    setSortBy('newest');
  };

  return (
    <div className="jobs-page">
      <Navbar />
      <div className="jobs-layout">
        <aside className="jobs-sidebar">
          <div className="jobs-sidebar-filters">
            <h3>Filters</h3>

            <div className="sidebar-filter-group">
              <label htmlFor="jobs-search">Search</label>
              <div className="sidebar-search">
                <Search size={16} />
                <input
                  id="jobs-search"
                  type="text"
                  placeholder="Title, skill, category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="sidebar-filter-group">
              <label htmlFor="jobs-category">Category</label>
              <select id="jobs-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="sidebar-filter-group">
              <label htmlFor="jobs-budget">Budget Type</label>
              <select id="jobs-budget" value={budgetType} onChange={(e) => setBudgetType(e.target.value)}>
                <option value="all">Any Budget Type</option>
                {JOB_BUDGET_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>

            <div className="sidebar-filter-group">
              <label htmlFor="jobs-sort">Sort By</label>
              <select id="jobs-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {JOB_SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <p className="jobs-count">{filtered.length} open job{filtered.length === 1 ? '' : 's'}</p>

            {hasFilters && (
              <button type="button" className="btn btn-ghost sidebar-clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          <Link to={user ? '/post-job' : '/login'} className="btn btn-primary jobs-sidebar-cta">
            <Plus size={18} /> Post a Job
          </Link>
        </aside>

        <main className="jobs-main">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="jobs-main-header">
              <div>
                <h1>Find <span className="gradient-text">Jobs</span></h1>
                <p>Browse open projects from clients across India.</p>
              </div>
            </div>

            {recommended.length > 0 && !hasFilters && (
              <div className="reco-section">
                <div className="reco-head">
                  <Sparkles size={18} />
                  <h2>Jobs matching your interests</h2>
                </div>
                <div className="jobs-grid">
                  {recommended.map((job, i) => (
                    <JobCard key={job.id} job={job} index={i} />
                  ))}
                </div>
              </div>
            )}

            {filtered.length > 0 ? (
              <div className="jobs-grid">
                {filtered.map((job, i) => (
                  <JobCard key={job.id} job={job} index={i} />
                ))}
              </div>
            ) : (
              <div className="jobs-empty">
                <Briefcase size={40} />
                <h3>No open jobs found</h3>
                <p>{hasFilters ? 'Try adjusting your filters.' : 'Be the first to post a job on Profinder.'}</p>
                <Link to={user ? '/post-job' : '/login'} className="btn btn-primary"><Plus size={18} /> Post a Job</Link>
              </div>
            )}
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

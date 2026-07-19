import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatINR } from '../utils/validation';
import { getProposalCount } from '../utils/storage';
import { Clock, MapPin, Users, Wallet } from 'lucide-react';
import './JobCard.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const STATUS_LABELS = {
  open: 'Open',
  'in-progress': 'Hired',
  closed: 'Closed',
};

export default function JobCard({ job, index = 0 }) {
  const proposals = getProposalCount(job.id);
  const budgetLabel = job.budgetType === 'hourly'
    ? `${formatINR(job.budget)}/hr`
    : formatINR(job.budget);

  return (
    <motion.article
      className="job-card card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="job-card-top">
        <div className="job-card-head">
          <Link to={`/job/${job.id}`} className="job-card-title">{job.title}</Link>
          <div className="job-card-sub">
            <span className="badge job-card-category">{job.category}</span>
            <span className={`job-card-status status-${job.status}`}>{STATUS_LABELS[job.status] || job.status}</span>
          </div>
        </div>
        <div className="job-card-budget">
          <span className="job-card-budget-amount">{budgetLabel}</span>
          <span className="job-card-budget-type">{job.budgetType === 'hourly' ? 'Hourly' : 'Fixed'}</span>
        </div>
      </div>

      <p className="job-card-desc">{job.description.slice(0, 160)}{job.description.length > 160 ? '…' : ''}</p>

      {job.skills?.length > 0 && (
        <div className="job-card-skills">
          {job.skills.slice(0, 5).map((skill) => (
            <span key={skill} className="job-skill">{skill}</span>
          ))}
          {job.skills.length > 5 && <span className="job-skill more">+{job.skills.length - 5}</span>}
        </div>
      )}

      <div className="job-card-meta">
        {job.duration && <span><Clock size={14} /> {job.duration}</span>}
        {job.location && <span><MapPin size={14} /> {job.location}</span>}
        <span><Users size={14} /> {proposals} proposal{proposals === 1 ? '' : 's'}</span>
        <span><Wallet size={14} /> by {job.posterName}</span>
      </div>

      <div className="job-card-footer">
        <span className="job-card-time">{timeAgo(job.createdAt)}</span>
        <Link to={`/job/${job.id}`} className="btn btn-outline job-card-btn">View Details</Link>
      </div>
    </motion.article>
  );
}

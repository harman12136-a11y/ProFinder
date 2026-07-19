import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProposalModal from '../components/ProposalModal';
import VerifiedBadge from '../components/VerifiedBadge';
import { useAuth } from '../hooks/useAuth';
import {
  getJobById, getProposalsForJob, getProposalsByFreelancer, hasApplied,
  hireForJob, closeJob, reopenJob, deleteJob, getUserById,
} from '../utils/storage';
import { formatINR } from '../utils/validation';
import { JOB_EXPERIENCE_LEVELS } from '../utils/constants';
import {
  Clock, MapPin, Wallet, Briefcase, Users, CheckCircle2, Trash2,
  Lock, RotateCcw, ArrowLeft, IndianRupee, Calendar,
} from 'lucide-react';
import './JobDetail.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const PROPOSAL_STATUS = {
  pending: { label: 'Pending', cls: 'ps-pending' },
  accepted: { label: 'Hired', cls: 'ps-accepted' },
  rejected: { label: 'Not selected', cls: 'ps-rejected' },
  withdrawn: { label: 'Withdrawn', cls: 'ps-withdrawn' },
};

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(() => getJobById(id));
  const [showApply, setShowApply] = useState(false);
  const [, force] = useState(0);
  const refresh = () => { setJob(getJobById(id)); force((n) => n + 1); };

  if (!job) {
    return (
      <div className="job-detail-page">
        <Navbar />
        <div className="page-container job-not-found">
          <h2>Job not found</h2>
          <p>This job may have been removed.</p>
          <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isPoster = user?.id === job.posterId;
  const proposals = isPoster ? getProposalsForJob(job.id) : [];
  const applied = user && !isPoster ? hasApplied(job.id, user.id) : false;
  const myProposal = applied ? getProposalsByFreelancer(user.id).find((p) => p.jobId === job.id) : null;
  const budgetLabel = job.budgetType === 'hourly' ? `${formatINR(job.budget)}/hr` : formatINR(job.budget);
  const expLabel = JOB_EXPERIENCE_LEVELS.find((x) => x.value === job.experienceLevel)?.label || job.experienceLevel;

  const handleHire = (proposalId) => {
    if (!window.confirm('Hire this freelancer? Other pending proposals will be declined.')) return;
    hireForJob(job.id, proposalId);
    refresh();
  };

  const handleClose = () => { closeJob(job.id); refresh(); };
  const handleReopen = () => { reopenJob(job.id); refresh(); };
  const handleDelete = () => {
    if (!window.confirm('Delete this job and all its proposals?')) return;
    deleteJob(job.id);
    navigate('/jobs');
  };

  return (
    <div className="job-detail-page">
      <Navbar />
      <div className="page-container job-detail-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/jobs" className="job-back"><ArrowLeft size={16} /> Back to jobs</Link>

          <div className="job-detail-grid">
            <div className="job-detail-main">
              <div className="job-detail-header card">
                <div className="job-detail-title-row">
                  <div>
                    <div className="job-detail-badges">
                      <span className="badge">{job.category}</span>
                      <span className={`job-card-status status-${job.status}`}>
                        {job.status === 'open' ? 'Open' : job.status === 'in-progress' ? 'Hired' : 'Closed'}
                      </span>
                    </div>
                    <h1>{job.title}</h1>
                    <p className="job-detail-poster">
                      Posted by{' '}
                      <Link to={`/creator/${job.posterId}`}>{job.posterName}</Link>
                      {(() => { const pu = getUserById(job.posterId); return pu ? <VerifiedBadge user={pu} /> : null; })()}
                      {' '}· {timeAgo(job.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="job-detail-stats">
                  <div><Wallet size={18} /><div><strong>{budgetLabel}</strong><span>{job.budgetType === 'hourly' ? 'Hourly rate' : 'Fixed price'}</span></div></div>
                  <div><Clock size={18} /><div><strong>{job.duration}</strong><span>Duration</span></div></div>
                  <div><Briefcase size={18} /><div><strong>{expLabel}</strong><span>Experience</span></div></div>
                  <div><MapPin size={18} /><div><strong>{job.location}</strong><span>Location</span></div></div>
                </div>
              </div>

              <div className="job-detail-section card">
                <h2>Job Description</h2>
                <p className="job-detail-desc">{job.description}</p>
              </div>

              {job.skills?.length > 0 && (
                <div className="job-detail-section card">
                  <h2>Skills Required</h2>
                  <div className="job-detail-skills">
                    {job.skills.map((skill) => <span key={skill} className="job-skill">{skill}</span>)}
                  </div>
                </div>
              )}

              {isPoster && (
                <div className="job-detail-section card">
                  <div className="proposals-header">
                    <h2>Proposals <span className="proposals-count">{proposals.length}</span></h2>
                  </div>
                  {proposals.length === 0 ? (
                    <p className="proposals-empty">No proposals yet. Share your job to attract talent.</p>
                  ) : (
                    <div className="proposals-list">
                      {proposals.map((p) => {
                        const freelancer = getUserById(p.freelancerId);
                        return (
                          <div key={p.id} className={`proposal-item ${p.status === 'accepted' ? 'hired' : ''}`}>
                            <div className="proposal-item-head">
                              <div className="proposal-item-who">
                                <div className="proposal-avatar">{p.freelancerName.charAt(0)}</div>
                                <div>
                                  <Link to={`/creator/${p.freelancerId}`} className="proposal-name">
                                    {p.freelancerName}
                                    {freelancer && <VerifiedBadge user={freelancer} />}
                                  </Link>
                                  <span className="proposal-time">{timeAgo(p.createdAt)}</span>
                                </div>
                              </div>
                              <span className={`proposal-status ${PROPOSAL_STATUS[p.status].cls}`}>{PROPOSAL_STATUS[p.status].label}</span>
                            </div>
                            <div className="proposal-terms">
                              <span><IndianRupee size={14} /> Bid: <strong>{formatINR(p.bidAmount)}</strong></span>
                              <span><Calendar size={14} /> {p.timeline}</span>
                            </div>
                            <p className="proposal-cover">{p.coverLetter}</p>
                            <div className="proposal-actions">
                              <Link to={`/messages?to=${p.freelancerId}`} className="btn btn-outline">Message</Link>
                              {job.status === 'open' && p.status === 'pending' && (
                                <button type="button" className="btn btn-primary" onClick={() => handleHire(p.id)}>
                                  <CheckCircle2 size={16} /> Hire
                                </button>
                              )}
                              {p.status === 'accepted' && <span className="proposal-hired-tag"><CheckCircle2 size={16} /> Hired</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <aside className="job-detail-sidebar">
              <div className="job-detail-cta card">
                {!user && (
                  <>
                    <h3>Interested in this job?</h3>
                    <p>Log in to send a proposal and get hired.</p>
                    <Link to="/login" className="btn btn-primary job-cta-btn">Log in to Apply</Link>
                  </>
                )}

                {user && isPoster && (
                  <>
                    <h3>Manage your job</h3>
                    <p>{proposals.length} proposal{proposals.length === 1 ? '' : 's'} received.</p>
                    {job.status === 'open' && (
                      <button type="button" className="btn btn-outline job-cta-btn" onClick={handleClose}>
                        <Lock size={16} /> Close Job
                      </button>
                    )}
                    {job.status === 'closed' && (
                      <button type="button" className="btn btn-outline job-cta-btn" onClick={handleReopen}>
                        <RotateCcw size={16} /> Reopen Job
                      </button>
                    )}
                    {job.status === 'in-progress' && (
                      <div className="job-hired-note"><CheckCircle2 size={16} /> You&apos;ve hired for this job</div>
                    )}
                    <button type="button" className="btn btn-outline job-cta-delete" onClick={handleDelete}>
                      <Trash2 size={16} /> Delete Job
                    </button>
                  </>
                )}

                {user && !isPoster && (
                  <>
                    {applied ? (
                      <div className="job-applied">
                        <CheckCircle2 size={22} />
                        <h3>Proposal submitted</h3>
                        <p>Your bid: <strong>{formatINR(myProposal?.bidAmount)}</strong></p>
                        <span className={`proposal-status ${PROPOSAL_STATUS[myProposal?.status]?.cls || 'ps-pending'}`}>
                          {PROPOSAL_STATUS[myProposal?.status]?.label || 'Pending'}
                        </span>
                        <Link to={`/messages?to=${job.posterId}`} className="btn btn-outline job-cta-btn">Message Client</Link>
                      </div>
                    ) : job.status === 'open' ? (
                      <>
                        <h3>Apply to this job</h3>
                        <p>Send a proposal with your bid and timeline.</p>
                        <button type="button" className="btn btn-primary job-cta-btn" onClick={() => setShowApply(true)}>
                          <Users size={16} /> Apply Now
                        </button>
                      </>
                    ) : (
                      <>
                        <h3>Applications closed</h3>
                        <p>This job is no longer accepting proposals.</p>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="job-detail-summary card">
                <div className="summary-row"><Users size={16} /> <span>{isPoster ? proposals.length : getProposalsForJob(job.id).length} proposals</span></div>
                <div className="summary-row"><Clock size={16} /> <span>Posted {timeAgo(job.createdAt)}</span></div>
                <div className="summary-row"><Wallet size={16} /> <span>{budgetLabel} · {job.budgetType === 'hourly' ? 'Hourly' : 'Fixed'}</span></div>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>

      <ProposalModal
        isOpen={showApply}
        onClose={() => setShowApply(false)}
        job={job}
        onSubmitted={refresh}
      />

      <Footer />
    </div>
  );
}

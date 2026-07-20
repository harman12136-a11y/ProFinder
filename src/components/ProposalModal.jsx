import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, IndianRupee } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { addProposal } from '../utils/storage';
import { formatINR } from '../utils/validation';
import './ProposalModal.css';

export default function ProposalModal({ isOpen, onClose, job, onSubmitted }) {
  const { user } = useAuth();
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [timeline, setTimeline] = useState('');
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!coverLetter.trim() || coverLetter.trim().length < 20) e.coverLetter = 'Write at least 20 characters';
    if (!bidAmount || Number(bidAmount) <= 0) e.bidAmount = 'Enter a valid bid amount';
    if (!timeline.trim()) e.timeline = 'Add an estimated timeline';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      await addProposal({
        jobId: job.id,
        freelancerId: user.id,
        freelancerName: user.name,
        coverLetter,
        bidAmount,
        timeline,
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setCoverLetter('');
        setBidAmount('');
        setTimeline('');
        onSubmitted?.();
        onClose();
      }, 1400);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to submit proposal. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="proposal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
        <motion.div
          className="proposal-modal card"
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="proposal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>

          {sent ? (
            <div className="proposal-sent">
              <div className="proposal-sent-check">✓</div>
              <h2>Proposal sent!</h2>
              <p>The client has been notified. You&apos;ll hear back via Messages.</p>
            </div>
          ) : (
            <>
              <h2>Apply to this job</h2>
              <p className="proposal-job-title">{job.title}</p>
              <div className="proposal-budget-hint">
                Client budget: <strong>{job.budgetType === 'hourly' ? `${formatINR(job.budget)}/hr` : formatINR(job.budget)}</strong>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-row proposal-row">
                  <div className="form-group">
                    <label htmlFor="bidAmount">Your Bid {job.budgetType === 'hourly' ? '(per hour)' : '(total)'}</label>
                    <div className="input-with-icon">
                      <IndianRupee size={18} />
                      <input
                        id="bidAmount"
                        type="number"
                        min="1"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="e.g. 15000"
                      />
                    </div>
                    {errors.bidAmount && <span className="form-error">{errors.bidAmount}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="timeline">Estimated Timeline</label>
                    <input
                      id="timeline"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      placeholder="e.g. 2 weeks"
                    />
                    {errors.timeline && <span className="form-error">{errors.timeline}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="coverLetter">Cover Letter</label>
                  <textarea
                    id="coverLetter"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Introduce yourself, explain why you're a great fit, and how you'll approach this job..."
                    rows={6}
                  />
                  {errors.coverLetter && <span className="form-error">{errors.coverLetter}</span>}
                </div>

                {errors.form && <span className="form-error">{errors.form}</span>}

                <button type="submit" className="btn btn-primary proposal-submit" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Proposal'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquareHeart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { addFeedback, hasSubmittedFeedback } from '../utils/storage';
import './FeedbackModal.css';

export default function FeedbackModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const alreadySubmitted = hasSubmittedFeedback(user?.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please share what you would change');
      return;
    }
    if (!user && !email.trim()) {
      setError('Email is required');
      return;
    }
    addFeedback({
      userId: user?.id,
      userName: user?.name,
      email: user?.email || email.trim(),
      message: message.trim(),
    });
    setSent(true);
    setTimeout(() => {
      onClose();
      setSent(false);
      setMessage('');
      setError('');
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="feedback-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
        <motion.div
          className="feedback-modal card"
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="feedback-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>

          <div className="feedback-icon">
            <MessageSquareHeart size={28} />
          </div>

          {alreadySubmitted && !sent ? (
            <div className="feedback-thanks">
              <h2>Thanks for your feedback!</h2>
              <p>You&apos;ve already shared your thoughts. We&apos;re reading every response.</p>
              <button type="button" className="btn btn-outline" onClick={onClose}>Close</button>
            </div>
          ) : sent ? (
            <div className="feedback-thanks">
              <h2>Thank you!</h2>
              <p>Your feedback helps us build a better Profinds for India.</p>
            </div>
          ) : (
            <>
              <h2>What would you change?</h2>
              <p className="feedback-sub">
                Profinds is early — your honest feedback shapes what we build next.
              </p>
              <form onSubmit={handleSubmit}>
                {!user && (
                  <div className="form-group">
                    <label htmlFor="feedback-email">Email</label>
                    <input
                      id="feedback-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                    />
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="feedback-message">Your feedback</label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What confused you? What's missing? What would make Profinds better?"
                    rows={5}
                  />
                  {error && <span className="form-error">{error}</span>}
                </div>
                <button type="submit" className="btn btn-primary feedback-submit">
                  Send Feedback
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

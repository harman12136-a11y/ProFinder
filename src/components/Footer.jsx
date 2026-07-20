import { useState } from 'react';
import Logo from './Logo';
import FeedbackModal from './FeedbackModal';
import { MessageSquareHeart } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <footer className="footer">
        <div className="page-container footer-inner">
          <div className="footer-brand">
            <Logo className="footer-logo" />
            <span>Profind</span>
          </div>
          <p className="footer-tagline">
            India&apos;s marketplace for code &amp; software. Built for Indian developers.
          </p>
          <button type="button" className="footer-feedback" onClick={() => setShowFeedback(true)}>
            <MessageSquareHeart size={16} />
            Feedback — what would you change?
          </button>
          <div className="footer-bottom">
            <span>© 2026 Profinds. Made in India 🇮🇳</span>
          </div>
        </div>
      </footer>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
}

import Logo from './Logo';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="page-container footer-inner">
        <div className="footer-brand">
          <Logo className="footer-logo" />
          <span>Profind</span>
        </div>
        <p className="footer-tagline">
          India&apos;s marketplace for code &amp; software. Built for Indian developers.
        </p>
        <div className="footer-bottom">
          <span>© 2026 Profinds. Made in India 🇮🇳</span>
        </div>
      </div>
    </footer>
  );
}

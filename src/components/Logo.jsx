import logo from '../assets/logo.png';

export default function Logo({ className = '', alt = 'Profinder' }) {
  return <img src={logo} alt={alt} className={`brand-logo ${className}`} />;
}

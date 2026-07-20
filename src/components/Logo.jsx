import logo from '../assets/logo.png';

export default function Logo({ className = '', alt = 'Profind' }) {
  return <img src={logo} alt={alt} className={`brand-logo ${className}`} />;
}

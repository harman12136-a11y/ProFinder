import { BadgeCheck } from 'lucide-react';
import { isUserVerified } from '../utils/verification';
import './VerifiedBadge.css';

export default function VerifiedBadge({ user, size = 'sm' }) {
  if (!isUserVerified(user)) return null;

  return (
    <span className={`verified-badge ${size}`} title="Verified developer">
      <BadgeCheck size={size === 'lg' ? 18 : 14} />
      Verified
    </span>
  );
}

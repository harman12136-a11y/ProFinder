import { useState } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toggleFollow, isFollowing } from '../utils/storage';
import './FollowButton.css';

export default function FollowButton({ creatorId, onChange }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(() => (user ? isFollowing(user.id, creatorId) : false));

  if (!user || user.id === creatorId) return null;

  const handleClick = () => {
    const next = toggleFollow(user.id, creatorId);
    setFollowing(next);
    onChange?.(next);
  };

  return (
    <button
      type="button"
      className={`follow-btn ${following ? 'following' : ''}`}
      onClick={handleClick}
    >
      {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
      {following ? 'Following' : 'Follow'}
    </button>
  );
}

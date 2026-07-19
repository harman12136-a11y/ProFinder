import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toggleLibraryItem, isInLibrary } from '../utils/storage';
import './SaveButton.css';

export default function SaveButton({ productId, onChange }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(() => (user ? isInLibrary(user.id, productId) : false));

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    const next = toggleLibraryItem(user.id, productId);
    setSaved(next);
    onChange?.(next);
  };

  if (!user) return null;

  return (
    <button
      type="button"
      className={`save-btn ${saved ? 'saved' : ''}`}
      onClick={handleClick}
      aria-label={saved ? 'Remove from library' : 'Save to library'}
    >
      <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}

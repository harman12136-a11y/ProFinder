import { Star } from 'lucide-react';
import './StarRating.css';

export default function StarRating({ value, onChange, readonly = false, size = 18 }) {
  return (
    <div className={`star-rating ${readonly ? 'readonly' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={star <= value ? 'active' : ''}
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          aria-label={`${star} star`}
        >
          <Star size={size} fill={star <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

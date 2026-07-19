import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getReviews, addReview, getProductRating } from '../utils/storage';
import StarRating from './StarRating';
import './ReviewsSection.css';

export default function ReviewsSection({ productId, sellerId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(() => getReviews(productId));
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const { avg, count } = getProductRating(productId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return;
    if (user.id === sellerId) {
      setError('You cannot review your own product');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a review');
      return;
    }
    try {
      addReview({ productId, userId: user.id, userName: user.name, rating, comment });
      setReviews(getReviews(productId));
      setComment('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="reviews-section card">
      <div className="reviews-header">
        <h2>Reviews & Ratings</h2>
        {count > 0 && (
          <div className="reviews-summary">
            <StarRating value={Math.round(avg)} readonly size={16} />
            <span>{avg} ({count} review{count !== 1 ? 's' : ''})</span>
          </div>
        )}
      </div>

      {user && user.id !== sellerId && (
        <form className="review-form" onSubmit={handleSubmit}>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this software..."
            rows={3}
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary">Submit Review</button>
        </form>
      )}

      <div className="reviews-list">
        {reviews.length > 0 ? reviews.map((r) => (
          <article key={r.id} className="review-item">
            <div className="review-item-header">
              <strong>{r.userName}</strong>
              <StarRating value={r.rating} readonly size={14} />
            </div>
            <p>{r.comment}</p>
            <time>{new Date(r.createdAt).toLocaleDateString('en-IN')}</time>
          </article>
        )) : (
          <p className="reviews-empty">No reviews yet. Be the first to share feedback.</p>
        )}
      </div>
    </section>
  );
}

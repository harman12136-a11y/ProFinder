import { CATEGORIES } from '../utils/categories';
import './CategoryMarquee.css';

export default function CategoryMarquee() {
  const items = [...CATEGORIES, ...CATEGORIES];

  return (
    <div className="category-marquee" aria-hidden="true">
      <div className="category-marquee-track">
        {items.map((category, i) => (
          <span key={`${category}-${i}`} className="category-marquee-item">
            {category}
          </span>
        ))}
      </div>
    </div>
  );
}

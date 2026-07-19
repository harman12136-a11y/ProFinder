import { CATEGORIES } from '../utils/categories';
import './CategoryPills.css';

export default function CategoryPills({ active, onChange }) {
  return (
    <div className="category-pills">
      <button
        type="button"
        className={`category-pill ${active === 'all' ? 'active' : ''}`}
        onClick={() => onChange('all')}
      >
        All
      </button>
      {CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          className={`category-pill ${active === category ? 'active' : ''}`}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export const CATEGORIES = [
  'React',
  'Python',
  'Flutter',
  'Node.js',
  'UI Kit',
  'SaaS',
  'API',
  'Mobile App',
  'Dashboard',
  'Automation',
  'AI/ML',
  'WordPress',
  'DevOps',
  'Templates',
  'Scripts',
  'Plugins',
  'E-commerce',
  'Education',
  'Productivity',
  'Gaming',
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export function sortListings(listings, sortBy) {
  const sorted = [...listings];
  switch (sortBy) {
    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price);
    case 'popular':
      return sorted.sort((a, b) => (b.sales || 0) - (a.sales || 0));
    case 'newest':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

export function filterListings(listings, { search = '', category = 'all' }) {
  return listings.filter((item) => {
    const matchesSearch = !search || [
      item.title,
      item.description,
      item.sellerName,
      item.category,
      ...(item.tags || []),
    ].join(' ').toLowerCase().includes(search.toLowerCase());

    const matchesCategory = category === 'all' || item.category === category;
    return matchesSearch && matchesCategory;
  });
}

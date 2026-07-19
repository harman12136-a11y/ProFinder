// Maps each broad survey interest to concrete keywords found in listings,
// jobs and services so we can match specific categories (React, Python, etc.)
const INTEREST_KEYWORDS = {
  'Web Development': ['web', 'react', 'node', 'javascript', 'typescript', 'frontend', 'backend', 'vue', 'angular', 'html', 'css', 'next', 'full stack', 'fullstack'],
  'Mobile Apps': ['mobile', 'flutter', 'android', 'ios', 'react native', 'kotlin', 'swift', 'app'],
  'UI/UX Design': ['ui', 'ux', 'design', 'figma', 'kit', 'template', 'landing'],
  'AI & Data': ['ai', 'ml', 'data', 'machine learning', 'python', 'analytics', 'model', 'llm', 'chatbot'],
  'SaaS & APIs': ['saas', 'api', 'backend', 'integration', 'microservice', 'boilerplate'],
  'E-commerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'payment', 'cart', 'checkout'],
  'WordPress': ['wordpress', 'wp', 'plugin', 'theme', 'elementor'],
  'Automation & Scripts': ['automation', 'script', 'bot', 'scraper', 'workflow', 'cron'],
  'Accounting & Tax': ['accounting', 'tax', 'gst', 'billing', 'invoice', 'audit', 'ca', 'chartered'],
  'Legal & Compliance': ['legal', 'compliance', 'law', 'contract', 'agreement', 'policy'],
  'Marketing & SEO': ['marketing', 'seo', 'ads', 'social', 'campaign', 'growth'],
  'Content & Writing': ['content', 'writing', 'copy', 'blog', 'article', 'writer'],
  'Astrology & Consulting': ['astrology', 'astrologer', 'consult', 'horoscope', 'tarot'],
  'Games': ['game', 'gaming', 'unity', 'unreal', 'godot'],
  'Education': ['education', 'course', 'tutor', 'learning', 'lms', 'quiz'],
  'Productivity': ['productivity', 'dashboard', 'tool', 'tracker', 'notes', 'task'],
};

function keywordsFor(interest) {
  return (
    INTEREST_KEYWORDS[interest] ||
    interest.toLowerCase().split(/[ &/]+/).filter((w) => w.length > 3)
  );
}

function matches(text, interests) {
  if (!interests || !interests.length) return false;
  const t = (text || '').toLowerCase();
  return interests.some((interest) => keywordsFor(interest).some((kw) => t.includes(kw)));
}

export function getUserInterests(user) {
  return user?.survey?.interests || [];
}

export function recommendListings(listings, user) {
  const interests = getUserInterests(user);
  if (!interests.length) return [];
  return listings.filter((l) =>
    matches(`${l.category || ''} ${l.title || ''} ${l.description || ''} ${(l.tags || []).join(' ')}`, interests)
  );
}

export function recommendJobs(jobs, user) {
  const interests = getUserInterests(user);
  if (!interests.length) return [];
  return jobs.filter((j) =>
    matches(`${j.category || ''} ${j.title || ''} ${j.description || ''} ${(j.skills || []).join(' ')}`, interests)
  );
}

export function recommendServices(services, user) {
  const interests = getUserInterests(user);
  if (!interests.length) return [];
  return services.filter((s) =>
    matches(
      `${s.profession || ''} ${s.professionOther || ''} ${s.servicesOffered || ''} ${s.bio || ''} ${s.name || ''}`,
      interests
    )
  );
}

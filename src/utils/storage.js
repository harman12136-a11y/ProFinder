const USERS_KEY = 'profinder_users';
const CURRENT_USER_KEY = 'profinder_current_user';
const SOFTWARE_KEY = 'profinder_software';
const LIBRARY_KEY = 'profinder_library';
const FOLLOWING_KEY = 'profinder_following';
const MESSAGES_KEY = 'profinder_messages';
const REVIEWS_KEY = 'profinder_reviews';
const BUNDLES_KEY = 'profinder_bundles';
const SERVICES_KEY = 'profinder_services';

function read(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getUsers() {
  return read(USERS_KEY, []);
}

export function saveUsers(users) {
  write(USERS_KEY, users);
}

export function getUserById(id) {
  return getUsers().find((u) => u.id === id) || null;
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getSoftwareListings() {
  return read(SOFTWARE_KEY, []);
}

export function getVisibleListings() {
  return getSoftwareListings().filter((s) => isSubscriptionActive(s.sellerId));
}

export function saveSoftwareListings(listings) {
  write(SOFTWARE_KEY, listings);
}

export function clearDemoListings() {
  const listings = getSoftwareListings();
  const filtered = listings.filter((s) => !String(s.id).startsWith('demo-'));
  if (filtered.length !== listings.length) {
    saveSoftwareListings(filtered);
  }
}

export function addSoftwareListing(listing) {
  const listings = getSoftwareListings();
  listings.unshift({
    sales: 0,
    contacts: 0,
    ...listing,
  });
  saveSoftwareListings(listings);
  return listing;
}

export function updateSoftwareListing(id, updates) {
  const listings = getSoftwareListings();
  const idx = listings.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  listings[idx] = { ...listings[idx], ...updates };
  saveSoftwareListings(listings);
  return listings[idx];
}

export function getSoftwareById(id) {
  return getSoftwareListings().find((s) => s.id === id);
}

export function getUserListings(userId) {
  return getSoftwareListings().filter((s) => s.sellerId === userId);
}

export function deleteSoftwareListing(id) {
  const listings = getSoftwareListings().filter((s) => s.id !== id);
  saveSoftwareListings(listings);

  const library = read(LIBRARY_KEY, {});
  Object.keys(library).forEach((userId) => {
    library[userId] = library[userId].filter((itemId) => itemId !== id);
  });
  write(LIBRARY_KEY, library);
}

export function getLibrary(userId) {
  const library = read(LIBRARY_KEY, {});
  return library[userId] || [];
}

export function toggleLibraryItem(userId, productId) {
  const library = read(LIBRARY_KEY, {});
  const items = library[userId] || [];
  const exists = items.includes(productId);
  library[userId] = exists ? items.filter((id) => id !== productId) : [...items, productId];
  write(LIBRARY_KEY, library);
  return !exists;
}

export function isInLibrary(userId, productId) {
  return getLibrary(userId).includes(productId);
}

export function getSavedListings(userId) {
  const ids = getLibrary(userId);
  return getSoftwareListings().filter((s) => ids.includes(s.id));
}

export function getFollowing(userId) {
  const following = read(FOLLOWING_KEY, {});
  return following[userId] || [];
}

export function toggleFollow(userId, creatorId) {
  if (userId === creatorId) return false;
  const following = read(FOLLOWING_KEY, {});
  const list = following[userId] || [];
  const exists = list.includes(creatorId);
  following[userId] = exists ? list.filter((id) => id !== creatorId) : [...list, creatorId];
  write(FOLLOWING_KEY, following);
  return !exists;
}

export function isFollowing(userId, creatorId) {
  return getFollowing(userId).includes(creatorId);
}

export function getFollowedListings(userId) {
  const creatorIds = getFollowing(userId);
  return getSoftwareListings().filter((s) => creatorIds.includes(s.sellerId));
}

export function getCreatorStats(userId) {
  const listings = getUserListings(userId);
  return {
    products: listings.length,
    contacts: listings.reduce((sum, item) => sum + (item.contacts || 0), 0),
    sales: listings.reduce((sum, item) => sum + (item.sales || 0), 0),
    revenue: listings.reduce((sum, item) => sum + (item.sales || 0) * item.price, 0),
  };
}

export function trackListingContact(id) {
  const listing = getSoftwareById(id);
  if (!listing) return;
  updateSoftwareListing(id, { contacts: (listing.contacts || 0) + 1, sales: (listing.sales || 0) + 1 });
}

export function getFeaturedListings() {
  const now = Date.now();
  return getVisibleListings().filter((s) => s.featured && s.featuredUntil && new Date(s.featuredUntil).getTime() > now);
}

export function featureListing(id, days = 7) {
  const until = new Date();
  until.setDate(until.getDate() + days);
  return updateSoftwareListing(id, { featured: true, featuredUntil: until.toISOString() });
}

export function getMessages(userId) {
  return read(MESSAGES_KEY, []).filter((m) => m.fromUserId === userId || m.toUserId === userId);
}

export function getConversation(userId, otherUserId, productId = null) {
  return read(MESSAGES_KEY, [])
    .filter((m) => {
      const between = (m.fromUserId === userId && m.toUserId === otherUserId)
        || (m.fromUserId === otherUserId && m.toUserId === userId);
      return productId ? between && m.productId === productId : between;
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export function sendMessage({ fromUserId, fromUserName, toUserId, productId, productTitle, subject, body }) {
  const messages = read(MESSAGES_KEY, []);
  const msg = {
    id: crypto.randomUUID(),
    fromUserId,
    fromUserName,
    toUserId,
    productId: productId || null,
    productTitle: productTitle || null,
    subject,
    body,
    read: false,
    createdAt: new Date().toISOString(),
  };
  messages.push(msg);
  write(MESSAGES_KEY, messages);
  if (productId) trackListingContact(productId);
  return msg;
}

export function markMessagesRead(userId, otherUserId) {
  const messages = read(MESSAGES_KEY, []);
  messages.forEach((m) => {
    if (m.toUserId === userId && m.fromUserId === otherUserId) m.read = true;
  });
  write(MESSAGES_KEY, messages);
}

export function getUnreadCount(userId) {
  return read(MESSAGES_KEY, []).filter((m) => m.toUserId === userId && !m.read).length;
}

export function getReviews(productId) {
  return read(REVIEWS_KEY, []).filter((r) => r.productId === productId);
}

export function getProductRating(productId) {
  const reviews = getReviews(productId);
  if (!reviews.length) return { avg: 0, count: 0 };
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return { avg: Math.round(avg * 10) / 10, count: reviews.length };
}

export function addReview({ productId, userId, userName, rating, comment }) {
  const reviews = read(REVIEWS_KEY, []);
  if (reviews.find((r) => r.productId === productId && r.userId === userId)) {
    throw new Error('You already reviewed this product');
  }
  const review = {
    id: crypto.randomUUID(),
    productId,
    userId,
    userName,
    rating,
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
  };
  reviews.push(review);
  write(REVIEWS_KEY, reviews);
  return review;
}

export function getBundles() {
  return read(BUNDLES_KEY, []);
}

export function getBundlesBySeller(sellerId) {
  return getBundles().filter((b) => b.sellerId === sellerId);
}

export function getBundleById(id) {
  return getBundles().find((b) => b.id === id);
}

export function addBundle(bundle) {
  const bundles = getBundles();
  bundles.unshift(bundle);
  write(BUNDLES_KEY, bundles);
  return bundle;
}

export function deleteBundle(id) {
  write(BUNDLES_KEY, getBundles().filter((b) => b.id !== id));
}

export function verifyUserField(userId, field, extra = {}) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx].verified = { ...(users[idx].verified || {}), [field]: true };
  if (field === 'github' && extra.githubUsername) {
    users[idx].githubUsername = extra.githubUsername;
  }
  saveUsers(users);
  const current = getCurrentUser();
  if (current?.id === userId) {
    const { password: _, ...safeUser } = users[idx];
    setCurrentUser(safeUser);
  }
  return users[idx];
}

export function updateUserProfile(userId, updates) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  const current = getCurrentUser();
  if (current?.id === userId) {
    const { password: _, ...safeUser } = users[idx];
    setCurrentUser(safeUser);
  }
  return users[idx];
}

export function getServices() {
  return read(SERVICES_KEY, []);
}

export function getServiceByUserId(userId) {
  return getServices().find((s) => s.userId === userId) || null;
}

export function isSubscriptionActive(userId) {
  const user = getUserById(userId);
  if (!user?.subscriptionExpiresAt) return false;
  return new Date(user.subscriptionExpiresAt) > new Date();
}

export function activateSubscription(userId, days = 30) {
  const user = getUserById(userId);
  if (!user) return null;
  const base = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date()
    ? new Date(user.subscriptionExpiresAt)
    : new Date();
  base.setDate(base.getDate() + days);
  return updateUserProfile(userId, { subscriptionExpiresAt: base.toISOString() });
}

export function renewSubscription(userId, days = 30) {
  return activateSubscription(userId, days);
}

export function isServiceActive(service) {
  if (!service?.registrationPaid) return false;
  return isSubscriptionActive(service.userId);
}

export function getActiveServices() {
  return getServices().filter(isServiceActive);
}

export function saveService(service) {
  const services = getServices();
  const idx = services.findIndex((s) => s.userId === service.userId);
  if (idx === -1) {
    services.unshift(service);
  } else {
    services[idx] = { ...services[idx], ...service };
  }
  write(SERVICES_KEY, services);
  return service;
}

export function registerServiceProfile(data) {
  const service = {
    id: crypto.randomUUID(),
    ...data,
    registrationPaid: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveService(service);
  activateSubscription(data.userId);
  return service;
}

export function renewServiceSubscription(userId, days = 30) {
  return renewSubscription(userId, days);
}

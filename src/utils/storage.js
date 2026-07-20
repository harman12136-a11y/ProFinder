const USERS_KEY = 'profinder_users';
const CURRENT_USER_KEY = 'profinder_current_user';
const SOFTWARE_KEY = 'profinder_software';
const LIBRARY_KEY = 'profinder_library';
const FOLLOWING_KEY = 'profinder_following';
const MESSAGES_KEY = 'profinder_messages';
export { MESSAGES_KEY };

const messageListeners = new Set();

export function subscribeMessages(listener) {
  messageListeners.add(listener);
  return () => messageListeners.delete(listener);
}

function emitMessages() {
  messageListeners.forEach((listener) => listener());
}
const REVIEWS_KEY = 'profinder_reviews';
const BUNDLES_KEY = 'profinder_bundles';
const SERVICES_KEY = 'profinder_services';
const FEEDBACK_KEY = 'profinder_feedback';
const JOBS_KEY = 'profinder_jobs';
const PROPOSALS_KEY = 'profinder_proposals';

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
  emitMessages();
  return msg;
}

export function markMessagesRead(userId, otherUserId) {
  const messages = read(MESSAGES_KEY, []);
  messages.forEach((m) => {
    if (m.toUserId === userId && m.fromUserId === otherUserId) m.read = true;
  });
  write(MESSAGES_KEY, messages);
  emitMessages();
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

export function updateServiceProfile(userId, updates) {
  const service = getServiceByUserId(userId);
  if (!service) return null;
  return saveService({
    ...service,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export function deleteServiceProfile(userId) {
  write(SERVICES_KEY, getServices().filter((s) => s.userId !== userId));
}

export function renewServiceSubscription(userId, days = 30) {
  return renewSubscription(userId, days);
}

export function addFeedback({ userId, userName, email, message }) {
  const feedback = read(FEEDBACK_KEY, []);
  feedback.unshift({
    id: crypto.randomUUID(),
    userId: userId || null,
    userName: userName || 'Anonymous',
    email: email || null,
    message,
    createdAt: new Date().toISOString(),
  });
  write(FEEDBACK_KEY, feedback);
  if (userId) {
    localStorage.setItem(`profinder_feedback_${userId}`, 'true');
  }
}

export function hasSubmittedFeedback(userId) {
  if (!userId) return false;
  return localStorage.getItem(`profinder_feedback_${userId}`) === 'true';
}

export function getFeedback() {
  return read(FEEDBACK_KEY, []);
}

export function getJobs() {
  return read(JOBS_KEY, []);
}

export function getOpenJobs() {
  return getJobs().filter((j) => j.status === 'open');
}

export function getJobById(id) {
  return getJobs().find((j) => j.id === id) || null;
}

export function getJobsByPoster(userId) {
  return getJobs().filter((j) => j.posterId === userId);
}

export function addJob(job) {
  const jobs = getJobs();
  const record = {
    id: crypto.randomUUID(),
    status: 'open',
    hiredProposalId: null,
    ...job,
    createdAt: new Date().toISOString(),
  };
  jobs.unshift(record);
  write(JOBS_KEY, jobs);
  return record;
}

export function updateJob(id, updates) {
  const jobs = getJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  jobs[idx] = { ...jobs[idx], ...updates };
  write(JOBS_KEY, jobs);
  return jobs[idx];
}

export function deleteJob(id) {
  write(JOBS_KEY, getJobs().filter((j) => j.id !== id));
  write(PROPOSALS_KEY, getAllProposals().filter((p) => p.jobId !== id));
}

export function closeJob(id) {
  return updateJob(id, { status: 'closed' });
}

export function reopenJob(id) {
  return updateJob(id, { status: 'open', hiredProposalId: null });
}

function getAllProposals() {
  return read(PROPOSALS_KEY, []);
}

export function getProposalsForJob(jobId) {
  return getAllProposals()
    .filter((p) => p.jobId === jobId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getProposalCount(jobId) {
  return getAllProposals().filter((p) => p.jobId === jobId).length;
}

export function getProposalsByFreelancer(userId) {
  return getAllProposals()
    .filter((p) => p.freelancerId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getProposalById(id) {
  return getAllProposals().find((p) => p.id === id) || null;
}

export function hasApplied(jobId, userId) {
  return getAllProposals().some((p) => p.jobId === jobId && p.freelancerId === userId);
}

export function addProposal({ jobId, freelancerId, freelancerName, coverLetter, bidAmount, timeline }) {
  const proposals = getAllProposals();
  if (proposals.some((p) => p.jobId === jobId && p.freelancerId === freelancerId)) {
    throw new Error('You have already applied to this job');
  }
  const proposal = {
    id: crypto.randomUUID(),
    jobId,
    freelancerId,
    freelancerName,
    coverLetter: coverLetter.trim(),
    bidAmount: Number(bidAmount),
    timeline: timeline.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  proposals.unshift(proposal);
  write(PROPOSALS_KEY, proposals);

  const job = getJobById(jobId);
  if (job) {
    sendMessage({
      fromUserId: freelancerId,
      fromUserName: freelancerName,
      toUserId: job.posterId,
      subject: `New proposal — ${job.title}`,
      body: `${freelancerName} applied to your job "${job.title}" with a bid of ₹${Number(bidAmount).toLocaleString('en-IN')}.`,
    });
  }
  return proposal;
}

export function withdrawProposal(id) {
  const proposals = getAllProposals();
  const idx = proposals.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  proposals[idx].status = 'withdrawn';
  write(PROPOSALS_KEY, proposals);
  return proposals[idx];
}

export function hireForJob(jobId, proposalId) {
  const proposals = getAllProposals();
  const target = proposals.find((p) => p.id === proposalId);
  if (!target) return null;

  proposals.forEach((p) => {
    if (p.jobId === jobId) {
      if (p.id === proposalId) p.status = 'accepted';
      else if (p.status === 'pending') p.status = 'rejected';
    }
  });
  write(PROPOSALS_KEY, proposals);
  updateJob(jobId, { status: 'in-progress', hiredProposalId: proposalId });

  const job = getJobById(jobId);
  if (job) {
    sendMessage({
      fromUserId: job.posterId,
      fromUserName: job.posterName,
      toUserId: target.freelancerId,
      subject: `You're hired — ${job.title}`,
      body: `Congratulations! ${job.posterName} hired you for "${job.title}". Reply here to coordinate the work.`,
    });
  }
  return target;
}

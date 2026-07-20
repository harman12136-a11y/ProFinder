import { FREE_PUBLISH_MODE } from './constants';
import { getCache, isCacheHydrated, setCacheHydrated } from './dataCache';
import {
  backupToLocalStorage,
  loadFromLocalStorage,
  syncListing,
  deleteListingFromSupabase,
  syncMessage,
  syncMessagesBatch,
  syncReview,
  syncBundle,
  deleteBundleFromSupabase,
  syncService,
  deleteServiceFromSupabase,
  syncJob,
  deleteJobFromSupabase,
  syncProposal,
  syncProposals,
  syncPurchase,
  deletePurchaseFromSupabase,
  syncSavedProduct,
  syncFollow,
  syncFeedbackItem,
  syncFeedbackFlag,
  syncListings,
  syncJobs,
  syncSavedProducts,
  syncFollows,
  deleteUserContentFromSupabase,
  ensureUserProfileSynced,
  notifyRemoteDataChanged,
} from './supabaseSync';

const MESSAGES_KEY = 'profinder_messages';
const CURRENT_USER_KEY = 'profinder_current_user';
export { MESSAGES_KEY };

const messageListeners = new Set();

export function subscribeMessages(listener) {
  messageListeners.add(listener);
  return () => messageListeners.delete(listener);
}

function emitMessages() {
  messageListeners.forEach((listener) => listener());
}

function ensureLoaded() {
  if (!isCacheHydrated()) {
    loadFromLocalStorage();
    setCacheHydrated(true);
  }
}

function persist() {
  backupToLocalStorage();
}

function readListings() {
  ensureLoaded();
  return getCache().listings;
}

function writeListings(listings) {
  getCache().listings = listings;
  persist();
}

function readMessages() {
  ensureLoaded();
  return getCache().messages;
}

function writeMessages(messages) {
  getCache().messages = messages;
  persist();
  syncMessagesBatch(messages);
}

function readReviews() {
  ensureLoaded();
  return getCache().reviews;
}

function writeReviews(reviews) {
  getCache().reviews = reviews;
  persist();
}

function readBundles() {
  ensureLoaded();
  return getCache().bundles;
}

function writeBundles(bundles) {
  getCache().bundles = bundles;
  persist();
}

function readServices() {
  ensureLoaded();
  return getCache().services;
}

function writeServices(services) {
  getCache().services = services;
  persist();
}

function readJobs() {
  ensureLoaded();
  return getCache().jobs;
}

function writeJobs(jobs) {
  getCache().jobs = jobs;
  persist();
}

function readProposals() {
  ensureLoaded();
  return getCache().proposals;
}

function writeProposals(proposals) {
  getCache().proposals = proposals;
  persist();
  syncProposals(proposals);
}

function readPurchases() {
  ensureLoaded();
  return getCache().purchases;
}

function writePurchases(purchases) {
  getCache().purchases = purchases;
  persist();
}

function readLibrary() {
  ensureLoaded();
  return getCache().library;
}

function writeLibrary(library) {
  getCache().library = library;
  persist();
}

function readFollowing() {
  ensureLoaded();
  return getCache().following;
}

function writeFollowing(following) {
  getCache().following = following;
  persist();
}

function readFeedback() {
  ensureLoaded();
  return getCache().feedback;
}

function writeFeedback(feedback) {
  getCache().feedback = feedback;
  persist();
}

function readUsers() {
  ensureLoaded();
  return getCache().users;
}

function writeUsers(users) {
  getCache().users = users;
  persist();
}

export function getUsers() {
  return readUsers();
}

export function saveUsers(users) {
  writeUsers(users);
}

export function getUserById(id) {
  if (!id) return null;
  const found = getUsers().find((u) => u.id === id);
  if (found) return found;
  const current = getCurrentUser();
  if (current?.id === id) return current;
  return null;
}

export function getSellerForListing(listing) {
  if (!listing) return null;
  return getUserById(listing.sellerId) || {
    id: listing.sellerId,
    name: listing.sellerName || 'Creator',
    verified: { email: false, phone: false, github: false },
  };
}

export function getSellerForService(service) {
  if (!service) return null;
  return getUserById(service.userId) || {
    id: service.userId,
    name: service.name || 'Professional',
    verified: { email: false, phone: false, github: false },
  };
}

export function getCreatorProfile(userId) {
  const user = getUserById(userId);
  if (user) return user;

  const listing = getUserListings(userId)[0];
  if (listing) {
    return {
      id: userId,
      name: listing.sellerName || 'Creator',
      bio: '',
      skills: [],
      portfolio: [],
      verified: { email: false, phone: false, github: false },
    };
  }

  const service = getServiceByUserId(userId);
  if (service) return getSellerForService(service);

  return null;
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
  return readListings();
}

export function getVisibleListings() {
  return getSoftwareListings().filter((s) => isSubscriptionActive(s.sellerId));
}

export function saveSoftwareListings(listings) {
  writeListings(listings);
}

export function clearDemoListings() {
  const listings = getSoftwareListings();
  const filtered = listings.filter((s) => !String(s.id).startsWith('demo-'));
  if (filtered.length !== listings.length) {
    saveSoftwareListings(filtered);
  }
}

export async function addSoftwareListing(listing) {
  const owner = getUserById(listing.sellerId) || getCurrentUser();
  await ensureUserProfileSynced(owner);

  const listings = readListings();
  const record = { sales: 0, contacts: 0, ...listing };
  listings.unshift(record);
  writeListings(listings);
  await syncListing(record);
  notifyRemoteDataChanged();
  return record;
}

export async function updateSoftwareListing(id, updates) {
  const listings = readListings();
  const idx = listings.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  listings[idx] = { ...listings[idx], ...updates };
  writeListings(listings);
  await syncListing(listings[idx]);
  notifyRemoteDataChanged();
  return listings[idx];
}

export function getSoftwareById(id) {
  return getSoftwareListings().find((s) => s.id === id);
}

export function getUserListings(userId) {
  return getSoftwareListings().filter((s) => s.sellerId === userId);
}

export function deleteSoftwareListing(id) {
  const listings = readListings().filter((s) => s.id !== id);
  writeListings(listings);
  deleteListingFromSupabase(id);

  const library = readLibrary();
  Object.keys(library).forEach((userId) => {
    library[userId] = library[userId].filter((itemId) => itemId !== id);
    syncSavedProduct(userId, library[userId]);
  });
  writeLibrary(library);
}

export function getLibrary(userId) {
  const library = readLibrary();
  return library[userId] || [];
}

export function toggleLibraryItem(userId, productId) {
  const library = readLibrary();
  const items = library[userId] || [];
  const exists = items.includes(productId);
  library[userId] = exists ? items.filter((pid) => pid !== productId) : [...items, productId];
  writeLibrary(library);
  syncSavedProduct(userId, library[userId]);
  return !exists;
}

export function isInLibrary(userId, productId) {
  return getLibrary(userId).includes(productId);
}

export function getSavedListings(userId) {
  const ids = getLibrary(userId);
  return getSoftwareListings().filter((s) => ids.includes(s.id));
}

export function getPurchases(userId) {
  return readPurchases()
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
}

export function getPurchaseLibrary(userId) {
  return getPurchases(userId).map((purchase) => ({
    purchase,
    product: getSoftwareById(purchase.productId) || null,
  }));
}

export function hasPurchased(userId, productId) {
  return readPurchases().some((p) => p.userId === userId && p.productId === productId);
}

export function recordPurchase({ userId, productId, price, productTitle, sellerId, sellerName, license }) {
  const all = readPurchases();
  if (all.some((p) => p.userId === userId && p.productId === productId)) {
    throw new Error('You already own this product');
  }

  const purchase = {
    id: crypto.randomUUID(),
    userId,
    productId,
    price,
    productTitle,
    sellerId,
    sellerName,
    license: license || '',
    purchasedAt: new Date().toISOString(),
  };
  all.push(purchase);
  writePurchases(all);
  syncPurchase(purchase);

  const listing = getSoftwareById(productId);
  if (listing) {
    void updateSoftwareListing(productId, { sales: (listing.sales || 0) + 1 });
  }
  return purchase;
}

export function removePurchase(userId, purchaseId) {
  const all = readPurchases();
  const next = all.filter((p) => !(p.id === purchaseId && p.userId === userId));
  if (next.length === all.length) return false;
  writePurchases(next);
  deletePurchaseFromSupabase(purchaseId);
  return true;
}

export function getFollowing(userId) {
  const following = readFollowing();
  return following[userId] || [];
}

export function toggleFollow(userId, creatorId) {
  if (userId === creatorId) return false;
  const following = readFollowing();
  const list = following[userId] || [];
  const exists = list.includes(creatorId);
  following[userId] = exists ? list.filter((id) => id !== creatorId) : [...list, creatorId];
  writeFollowing(following);
  syncFollow(userId, following[userId]);
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
  void updateSoftwareListing(id, { contacts: (listing.contacts || 0) + 1 });
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
  return readMessages().filter((m) => m.fromUserId === userId || m.toUserId === userId);
}

export function getConversation(userId, otherUserId, productId = null) {
  return readMessages()
    .filter((m) => {
      const between = (m.fromUserId === userId && m.toUserId === otherUserId)
        || (m.fromUserId === otherUserId && m.toUserId === userId);
      return productId ? between && m.productId === productId : between;
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export function sendMessage({ fromUserId, fromUserName, toUserId, productId, productTitle, subject, body }) {
  const messages = readMessages();
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
  writeMessages(messages);
  syncMessage(msg);
  if (productId) trackListingContact(productId);
  emitMessages();
  return msg;
}

export function markMessagesRead(userId, otherUserId) {
  const messages = readMessages();
  messages.forEach((m) => {
    if (m.toUserId === userId && m.fromUserId === otherUserId) m.read = true;
  });
  writeMessages(messages);
  syncMessagesBatch(messages);
  emitMessages();
}

export function getUnreadCount(userId) {
  return readMessages().filter((m) => m.toUserId === userId && !m.read).length;
}

export function getReviews(productId) {
  return readReviews().filter((r) => r.productId === productId);
}

export function getProductRating(productId) {
  const reviews = getReviews(productId);
  if (!reviews.length) return { avg: 0, count: 0 };
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return { avg: Math.round(avg * 10) / 10, count: reviews.length };
}

export function addReview({ productId, userId, userName, rating, comment }) {
  const reviews = readReviews();
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
  writeReviews(reviews);
  syncReview(review);
  return review;
}

export function getBundles() {
  return readBundles();
}

export function getBundlesBySeller(sellerId) {
  return getBundles().filter((b) => b.sellerId === sellerId);
}

export function getBundleById(id) {
  return getBundles().find((b) => b.id === id);
}

export function addBundle(bundle) {
  const bundles = readBundles();
  bundles.unshift(bundle);
  writeBundles(bundles);
  syncBundle(bundle);
  return bundle;
}

export function deleteBundle(id) {
  writeBundles(readBundles().filter((b) => b.id !== id));
  deleteBundleFromSupabase(id);
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

export async function deleteUserAccount(userId) {
  const listingIds = getUserListings(userId).map((l) => l.id);
  const jobIds = getJobsByPoster(userId).map((j) => j.id);

  // Listings, bundles, services, jobs owned by this user
  writeListings(readListings().filter((s) => s.sellerId !== userId));
  writeBundles(readBundles().filter((b) => b.sellerId !== userId));
  writeServices(readServices().filter((s) => s.userId !== userId));
  writeJobs(readJobs().filter((j) => j.posterId !== userId));

  // Proposals on their jobs + proposals they submitted
  writeProposals(readProposals().filter(
    (p) => p.freelancerId !== userId && !jobIds.includes(p.jobId)
  ));

  writePurchases(readPurchases().filter((p) => p.userId !== userId));
  writeMessages(readMessages().filter((m) => m.fromUserId !== userId && m.toUserId !== userId));
  writeReviews(readReviews().filter((r) => r.userId !== userId));
  writeFeedback(readFeedback().filter((f) => f.userId !== userId));

  const library = readLibrary();
  delete library[userId];
  listingIds.forEach((listingId) => {
    Object.keys(library).forEach((uid) => {
      library[uid] = (library[uid] || []).filter((itemId) => itemId !== listingId);
    });
  });
  writeLibrary(library);
  syncSavedProducts(library);

  const following = readFollowing();
  delete following[userId];
  Object.keys(following).forEach((uid) => {
    following[uid] = (following[uid] || []).filter((creatorId) => creatorId !== userId);
  });
  writeFollowing(following);
  syncFollows(following);

  writeUsers(readUsers().filter((u) => u.id !== userId));

  if (getCurrentUser()?.id === userId) setCurrentUser(null);
  localStorage.removeItem(`profinder_feedback_${userId}`);

  await deleteUserContentFromSupabase(userId);

  emitMessages();
  window.dispatchEvent(new Event('profinder-refresh'));
}

export function getServices() {
  return readServices();
}

export function getServiceByUserId(userId) {
  return getServices().find((s) => s.userId === userId) || null;
}

export function isSubscriptionActive(userId) {
  if (FREE_PUBLISH_MODE) return true;
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
  if (FREE_PUBLISH_MODE) return Boolean(service);
  if (!service?.registrationPaid) return false;
  return isSubscriptionActive(service.userId);
}

export function getActiveServices() {
  return getServices().filter(isServiceActive);
}

export async function saveService(service) {
  const owner = getUserById(service.userId) || getCurrentUser();
  await ensureUserProfileSynced(owner);

  const services = readServices();
  const idx = services.findIndex((s) => s.userId === service.userId);
  const record = idx === -1
    ? service
    : { ...services[idx], ...service };
  if (idx === -1) {
    services.unshift(record);
  } else {
    services[idx] = record;
  }
  writeServices(services);
  await syncService(record);
  notifyRemoteDataChanged();
  return record;
}

export async function registerServiceProfile(data) {
  const service = {
    id: crypto.randomUUID(),
    ...data,
    registrationPaid: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveService(service);
  activateSubscription(data.userId);
  return service;
}

export async function updateServiceProfile(userId, updates) {
  const service = getServiceByUserId(userId);
  if (!service) return null;
  return saveService({
    ...service,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export function deleteServiceProfile(userId) {
  writeServices(readServices().filter((s) => s.userId !== userId));
  deleteServiceFromSupabase(userId);
}

export function renewServiceSubscription(userId, days = 30) {
  return renewSubscription(userId, days);
}

export function addFeedback({ userId, userName, email, message }) {
  const feedback = readFeedback();
  const item = {
    id: crypto.randomUUID(),
    userId: userId || null,
    userName: userName || 'Anonymous',
    email: email || null,
    message,
    createdAt: new Date().toISOString(),
  };
  feedback.unshift(item);
  writeFeedback(feedback);
  syncFeedbackItem(item);
  if (userId) {
    getCache().feedbackFlags[userId] = true;
    syncFeedbackFlag(userId);
    localStorage.setItem(`profinder_feedback_${userId}`, 'true');
  }
}

export function hasSubmittedFeedback(userId) {
  if (!userId) return false;
  ensureLoaded();
  if (getCache().feedbackFlags[userId]) return true;
  return localStorage.getItem(`profinder_feedback_${userId}`) === 'true';
}

export function getFeedback() {
  return readFeedback();
}

export function getJobs() {
  return readJobs();
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

export async function addJob(job) {
  const owner = getUserById(job.posterId) || getCurrentUser();
  await ensureUserProfileSynced(owner);

  const jobs = readJobs();
  const record = {
    id: crypto.randomUUID(),
    status: 'open',
    hiredProposalId: null,
    ...job,
    createdAt: new Date().toISOString(),
  };
  jobs.unshift(record);
  writeJobs(jobs);
  await syncJob(record);
  notifyRemoteDataChanged();
  return record;
}

export async function updateJob(id, updates) {
  const jobs = readJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  jobs[idx] = { ...jobs[idx], ...updates };
  writeJobs(jobs);
  await syncJob(jobs[idx]);
  notifyRemoteDataChanged();
  return jobs[idx];
}

export function deleteJob(id) {
  writeJobs(readJobs().filter((j) => j.id !== id));
  writeProposals(readProposals().filter((p) => p.jobId !== id));
  deleteJobFromSupabase(id);
}

export function closeJob(id) {
  return updateJob(id, { status: 'closed' });
}

export function reopenJob(id) {
  return updateJob(id, { status: 'open', hiredProposalId: null });
}

function getAllProposals() {
  return readProposals();
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

export async function addProposal({ jobId, freelancerId, freelancerName, coverLetter, bidAmount, timeline }) {
  const owner = getUserById(freelancerId) || getCurrentUser();
  await ensureUserProfileSynced(owner);

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
  writeProposals(proposals);
  await syncProposal(proposal);
  notifyRemoteDataChanged();

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
  writeProposals(proposals);
  syncProposal(proposals[idx]);
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
  writeProposals(proposals);
  proposals.filter((p) => p.jobId === jobId).forEach(syncProposal);
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

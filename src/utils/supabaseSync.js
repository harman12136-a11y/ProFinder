import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { profileToUser, upsertProfile, userToProfileRow } from './supabaseProfiles';
import { getCache, setCacheHydrated } from './dataCache';

function throwIfError(result, context) {
  if (result?.error) {
    throw new Error(result.error.message || `Failed to sync ${context}`);
  }
}

/** Ensure profile exists in Supabase before FK-linked writes (listings, jobs, services). */
export async function ensureUserProfileSynced(user) {
  if (!isSupabaseConfigured() || !user?.id) return;

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  if (!session) {
    throw new Error('Please log in again to publish across devices.');
  }

  await upsertProfile(userToProfileRow(user));
}

export function notifyRemoteDataChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('profinder-refresh'));
  }
}

function mapRows(res, mapper, fallback = []) {
  if (res.error) {
    console.warn('Supabase hydrate warning:', res.error.message);
    return fallback;
  }
  const rows = (res.data || []).map(mapper);
  return rows.length ? rows : fallback;
}

const LS_KEYS = {
  listings: 'profinder_software',
  messages: 'profinder_messages',
  reviews: 'profinder_reviews',
  bundles: 'profinder_bundles',
  services: 'profinder_services',
  jobs: 'profinder_jobs',
  proposals: 'profinder_proposals',
  purchases: 'profinder_purchases',
  library: 'profinder_library',
  following: 'profinder_following',
  feedback: 'profinder_feedback',
  users: 'profinder_users',
};

export function loadFromLocalStorage() {
  const cache = getCache();
  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  cache.listings = read(LS_KEYS.listings, []);
  cache.messages = read(LS_KEYS.messages, []);
  cache.reviews = read(LS_KEYS.reviews, []);
  cache.bundles = read(LS_KEYS.bundles, []);
  cache.services = read(LS_KEYS.services, []);
  cache.jobs = read(LS_KEYS.jobs, []);
  cache.proposals = read(LS_KEYS.proposals, []);
  cache.purchases = read(LS_KEYS.purchases, []);
  cache.library = read(LS_KEYS.library, {});
  cache.following = read(LS_KEYS.following, {});
  cache.feedback = read(LS_KEYS.feedback, []);
  cache.users = read(LS_KEYS.users, []);

  cache.feedbackFlags = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith('profinder_feedback_') && key !== LS_KEYS.feedback) {
      const userId = key.replace('profinder_feedback_', '');
      if (localStorage.getItem(key) === 'true') cache.feedbackFlags[userId] = true;
    }
  }
}

export function backupToLocalStorage() {
  const cache = getCache();
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  write(LS_KEYS.listings, cache.listings);
  write(LS_KEYS.messages, cache.messages);
  write(LS_KEYS.reviews, cache.reviews);
  write(LS_KEYS.bundles, cache.bundles);
  write(LS_KEYS.services, cache.services);
  write(LS_KEYS.jobs, cache.jobs);
  write(LS_KEYS.proposals, cache.proposals);
  write(LS_KEYS.purchases, cache.purchases);
  write(LS_KEYS.library, cache.library);
  write(LS_KEYS.following, cache.following);
  write(LS_KEYS.feedback, cache.feedback);
  write(LS_KEYS.users, cache.users);
}

export async function hydrateStore() {
  if (!isSupabaseConfigured()) {
    loadFromLocalStorage();
    setCacheHydrated(true);
    return;
  }

  loadFromLocalStorage();
  const cache = getCache();
  const localBackup = {
    listings: [...cache.listings],
    messages: [...cache.messages],
    reviews: [...cache.reviews],
    bundles: [...cache.bundles],
    services: [...cache.services],
    jobs: [...cache.jobs],
    proposals: [...cache.proposals],
    purchases: [...cache.purchases],
    library: { ...cache.library },
    following: { ...cache.following },
    feedback: [...cache.feedback],
    users: [...cache.users],
  };

  const [
    profilesRes,
    listingsRes,
    messagesRes,
    reviewsRes,
    bundlesRes,
    servicesRes,
    jobsRes,
    proposalsRes,
    purchasesRes,
    savedRes,
    followsRes,
    feedbackRes,
    flagsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('software_listings').select('data'),
    supabase.from('messages').select('data'),
    supabase.from('reviews').select('data'),
    supabase.from('bundles').select('data'),
    supabase.from('services').select('data'),
    supabase.from('jobs').select('data'),
    supabase.from('proposals').select('data'),
    supabase.from('purchases').select('data'),
    supabase.from('saved_products').select('user_id, product_id'),
    supabase.from('follows').select('follower_id, creator_id'),
    supabase.from('feedback').select('data'),
    supabase.from('feedback_flags').select('user_id'),
  ]);

  if (profilesRes.error) {
    console.warn('Profiles hydrate warning:', profilesRes.error.message);
  }
  if (profilesRes.data?.length) {
    cache.users = profilesRes.data.map((row) => profileToUser(row));
  } else if (localBackup.users.length) {
    cache.users = localBackup.users;
  }

  cache.listings = mapRows(listingsRes, (r) => r.data, localBackup.listings);
  cache.messages = mapRows(messagesRes, (r) => r.data, localBackup.messages);
  cache.reviews = mapRows(reviewsRes, (r) => r.data, localBackup.reviews);
  cache.bundles = mapRows(bundlesRes, (r) => r.data, localBackup.bundles);
  cache.services = mapRows(servicesRes, (r) => r.data, localBackup.services);
  cache.jobs = mapRows(jobsRes, (r) => r.data, localBackup.jobs);
  cache.proposals = mapRows(proposalsRes, (r) => r.data, localBackup.proposals);
  cache.purchases = mapRows(purchasesRes, (r) => r.data, localBackup.purchases);

  if (savedRes.error) {
    cache.library = localBackup.library;
  } else {
    cache.library = {};
    (savedRes.data || []).forEach(({ user_id, product_id }) => {
      if (!cache.library[user_id]) cache.library[user_id] = [];
      cache.library[user_id].push(product_id);
    });
  }

  if (followsRes.error) {
    cache.following = localBackup.following;
  } else {
    cache.following = {};
    (followsRes.data || []).forEach(({ follower_id, creator_id }) => {
      if (!cache.following[follower_id]) cache.following[follower_id] = [];
      cache.following[follower_id].push(creator_id);
    });
  }

  const localFeedbackFlags = { ...cache.feedbackFlags };

  cache.feedback = mapRows(feedbackRes, (r) => r.data, localBackup.feedback);
  cache.feedbackFlags = {};
  if (!flagsRes.error) {
    (flagsRes.data || []).forEach(({ user_id }) => {
      cache.feedbackFlags[user_id] = true;
    });
  } else {
    Object.assign(cache.feedbackFlags, localFeedbackFlags);
  }

  await pushLocalOnlyContent(localBackup, cache, {
    listings: listingsRes,
    jobs: jobsRes,
    services: servicesRes,
    proposals: proposalsRes,
  });

  finishHydrate();
}

async function pushLocalOnlyContent(localBackup, cache, remote) {
  if (!isSupabaseConfigured()) return;

  const syncMissing = async (localItems, cacheItems, remoteRes, syncFn, getId) => {
    if (!localItems.length) return;
    if (remoteRes.error) return;

    const remoteItems = (remoteRes.data || []).map((row) => row.data);
    let missing = localItems;

    if (remoteItems.length > 0) {
      const remoteIds = new Set(remoteItems.map(getId));
      missing = localItems.filter((item) => !remoteIds.has(getId(item)));
    }

    if (!missing.length) return;

    const cacheIds = new Set(cacheItems.map(getId));
    const toAdd = missing.filter((item) => !cacheIds.has(getId(item)));
    if (toAdd.length) {
      if (cacheItems === cache.listings) cache.listings = [...toAdd, ...cache.listings];
      else if (cacheItems === cache.jobs) cache.jobs = [...toAdd, ...cache.jobs];
      else if (cacheItems === cache.services) cache.services = [...toAdd, ...cache.services];
      else if (cacheItems === cache.proposals) cache.proposals = [...toAdd, ...cache.proposals];
    }

    await syncFn(missing);
  };

  await Promise.all([
    syncMissing(localBackup.listings, cache.listings, remote.listings, syncListings, (l) => l.id),
    syncMissing(localBackup.jobs, cache.jobs, remote.jobs, syncJobs, (j) => j.id),
    syncMissing(localBackup.services, cache.services, remote.services, syncServices, (s) => s.userId),
    syncMissing(localBackup.proposals, cache.proposals, remote.proposals, syncProposals, (p) => p.id),
  ]);
}

function finishHydrate() {
  backupToLocalStorage();
  setCacheHydrated(true);
}

export function persistCache() {
  backupToLocalStorage();
  if (!isSupabaseConfigured()) return;
  syncAllToSupabase();
}

async function syncAllToSupabase() {
  const cache = getCache();
  await Promise.all([
    syncListings(cache.listings),
    syncMessages(cache.messages),
    syncReviews(cache.reviews),
    syncBundles(cache.bundles),
    syncServices(cache.services),
    syncJobs(cache.jobs),
    syncProposals(cache.proposals),
    syncPurchases(cache.purchases),
    syncSavedProducts(cache.library),
    syncFollows(cache.following),
    syncFeedback(cache.feedback),
    syncFeedbackFlags(cache.feedbackFlags),
  ]);
}

export async function syncListings(listings) {
  if (!isSupabaseConfigured() || !listings?.length) return;
  const rows = listings.map((l) => ({
    id: l.id,
    seller_id: l.sellerId || null,
    data: l,
  }));
  await supabase.from('software_listings').upsert(rows, { onConflict: 'id' });
}

export async function syncListing(listing) {
  if (!isSupabaseConfigured()) return;
  const result = await supabase.from('software_listings').upsert({
    id: listing.id,
    seller_id: listing.sellerId || null,
    data: listing,
  }, { onConflict: 'id' });
  throwIfError(result, 'listing');
}

export async function deleteListingFromSupabase(id) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('software_listings').delete().eq('id', id);
}

/** Remove all marketplace content owned by a user before profile deletion. */
export async function deleteUserContentFromSupabase(userId) {
  if (!isSupabaseConfigured() || !userId) return;

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('poster_id', userId);
  const jobIds = (jobs || []).map((j) => j.id);

  await Promise.all([
    supabase.from('software_listings').delete().eq('seller_id', userId),
    supabase.from('bundles').delete().eq('seller_id', userId),
    supabase.from('services').delete().eq('user_id', userId),
    supabase.from('jobs').delete().eq('poster_id', userId),
    supabase.from('proposals').delete().eq('freelancer_id', userId),
    supabase.from('messages').delete().eq('from_user_id', userId),
    supabase.from('messages').delete().eq('to_user_id', userId),
    supabase.from('reviews').delete().eq('user_id', userId),
    supabase.from('purchases').delete().eq('user_id', userId),
    supabase.from('saved_products').delete().eq('user_id', userId),
    supabase.from('follows').delete().eq('follower_id', userId),
    supabase.from('follows').delete().eq('creator_id', userId),
    supabase.from('feedback_flags').delete().eq('user_id', userId),
  ]);

  if (jobIds.length) {
    await supabase.from('proposals').delete().in('job_id', jobIds);
  }
}

export async function syncMessages(messages) {
  if (!isSupabaseConfigured() || !messages?.length) return;
  const rows = messages.map((m) => ({
    id: m.id,
    from_user_id: m.fromUserId || null,
    to_user_id: m.toUserId || null,
    data: m,
  }));
  await supabase.from('messages').upsert(rows, { onConflict: 'id' });
}

export async function syncMessage(msg) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('messages').upsert({
    id: msg.id,
    from_user_id: msg.fromUserId || null,
    to_user_id: msg.toUserId || null,
    data: msg,
  }, { onConflict: 'id' });
}

export async function syncMessagesBatch(messages) {
  if (!isSupabaseConfigured()) return;
  const rows = messages.map((m) => ({
    id: m.id,
    from_user_id: m.fromUserId || null,
    to_user_id: m.toUserId || null,
    data: m,
  }));
  if (rows.length) await supabase.from('messages').upsert(rows, { onConflict: 'id' });
}

export async function syncReviews(reviews) {
  if (!isSupabaseConfigured() || !reviews?.length) return;
  const rows = reviews.map((r) => ({
    id: r.id,
    product_id: r.productId,
    user_id: r.userId || null,
    data: r,
  }));
  await supabase.from('reviews').upsert(rows, { onConflict: 'id' });
}

export async function syncReview(review) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('reviews').upsert({
    id: review.id,
    product_id: review.productId,
    user_id: review.userId || null,
    data: review,
  }, { onConflict: 'id' });
}

export async function syncBundles(bundles) {
  if (!isSupabaseConfigured() || !bundles?.length) return;
  const rows = bundles.map((b) => ({
    id: b.id,
    seller_id: b.sellerId || null,
    data: b,
  }));
  await supabase.from('bundles').upsert(rows, { onConflict: 'id' });
}

export async function syncBundle(bundle) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('bundles').upsert({
    id: bundle.id,
    seller_id: bundle.sellerId || null,
    data: bundle,
  }, { onConflict: 'id' });
}

export async function deleteBundleFromSupabase(id) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('bundles').delete().eq('id', id);
}

export async function syncServices(services) {
  if (!isSupabaseConfigured() || !services?.length) return;
  const rows = services.map((s) => ({
    id: s.id,
    user_id: s.userId || null,
    data: s,
  }));
  await supabase.from('services').upsert(rows, { onConflict: 'id' });
}

export async function syncService(service) {
  if (!isSupabaseConfigured()) return;
  const result = await supabase.from('services').upsert({
    id: service.id,
    user_id: service.userId || null,
    data: service,
  }, { onConflict: 'id' });
  throwIfError(result, 'service');
}

export async function deleteServiceFromSupabase(userId) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('services').delete().eq('user_id', userId);
}

export async function syncJobs(jobs) {
  if (!isSupabaseConfigured() || !jobs?.length) return;
  const rows = jobs.map((j) => ({
    id: j.id,
    poster_id: j.posterId || null,
    data: j,
  }));
  await supabase.from('jobs').upsert(rows, { onConflict: 'id' });
}

export async function syncJob(job) {
  if (!isSupabaseConfigured()) return;
  const result = await supabase.from('jobs').upsert({
    id: job.id,
    poster_id: job.posterId || null,
    data: job,
  }, { onConflict: 'id' });
  throwIfError(result, 'job');
}

export async function deleteJobFromSupabase(id) {
  if (!isSupabaseConfigured()) return;
  await Promise.all([
    supabase.from('jobs').delete().eq('id', id),
    supabase.from('proposals').delete().eq('job_id', id),
  ]);
}

export async function syncProposals(proposals) {
  if (!isSupabaseConfigured() || !proposals?.length) return;
  const rows = proposals.map((p) => ({
    id: p.id,
    job_id: p.jobId,
    freelancer_id: p.freelancerId || null,
    data: p,
  }));
  await supabase.from('proposals').upsert(rows, { onConflict: 'id' });
}

export async function syncProposal(proposal) {
  if (!isSupabaseConfigured()) return;
  const result = await supabase.from('proposals').upsert({
    id: proposal.id,
    job_id: proposal.jobId,
    freelancer_id: proposal.freelancerId || null,
    data: proposal,
  }, { onConflict: 'id' });
  throwIfError(result, 'proposal');
}

export async function syncPurchases(purchases) {
  if (!isSupabaseConfigured() || !purchases?.length) return;
  const rows = purchases.map((p) => ({
    id: p.id,
    user_id: p.userId || null,
    product_id: p.productId,
    data: p,
  }));
  await supabase.from('purchases').upsert(rows, { onConflict: 'id' });
}

export async function syncPurchase(purchase) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('purchases').upsert({
    id: purchase.id,
    user_id: purchase.userId || null,
    product_id: purchase.productId,
    data: purchase,
  }, { onConflict: 'id' });
}

export async function deletePurchaseFromSupabase(id) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('purchases').delete().eq('id', id);
}

export async function syncSavedProducts(library) {
  if (!isSupabaseConfigured()) return;
  const rows = [];
  Object.entries(library).forEach(([userId, productIds]) => {
    (productIds || []).forEach((productId) => {
      rows.push({ user_id: userId, product_id: productId });
    });
  });
  await supabase.from('saved_products').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
  if (rows.length) await supabase.from('saved_products').upsert(rows);
}

export async function syncSavedProduct(userId, productIds) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('saved_products').delete().eq('user_id', userId);
  const rows = (productIds || []).map((productId) => ({ user_id: userId, product_id: productId }));
  if (rows.length) await supabase.from('saved_products').upsert(rows);
}

export async function syncFollows(following) {
  if (!isSupabaseConfigured()) return;
  const rows = [];
  Object.entries(following).forEach(([followerId, creatorIds]) => {
    (creatorIds || []).forEach((creatorId) => {
      rows.push({ follower_id: followerId, creator_id: creatorId });
    });
  });
  await supabase.from('follows').delete().neq('follower_id', '00000000-0000-0000-0000-000000000000');
  if (rows.length) await supabase.from('follows').upsert(rows);
}

export async function syncFollow(userId, creatorIds) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('follows').delete().eq('follower_id', userId);
  const rows = (creatorIds || []).map((creatorId) => ({ follower_id: userId, creator_id: creatorId }));
  if (rows.length) await supabase.from('follows').upsert(rows);
}

export async function syncFeedback(feedback) {
  if (!isSupabaseConfigured() || !feedback?.length) return;
  const rows = feedback.map((f) => ({
    id: f.id,
    user_id: f.userId || null,
    data: f,
  }));
  await supabase.from('feedback').upsert(rows, { onConflict: 'id' });
}

export async function syncFeedbackItem(item) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('feedback').upsert({
    id: item.id,
    user_id: item.userId || null,
    data: item,
  }, { onConflict: 'id' });
}

export async function syncFeedbackFlags(flags) {
  if (!isSupabaseConfigured()) return;
  const rows = Object.keys(flags).map((userId) => ({ user_id: userId }));
  await supabase.from('feedback_flags').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
  if (rows.length) await supabase.from('feedback_flags').upsert(rows);
}

export async function syncFeedbackFlag(userId) {
  if (!isSupabaseConfigured()) return;
  await supabase.from('feedback_flags').upsert({ user_id: userId });
}

export function subscribeToRealtime(onChange) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase
    .channel('profinder-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'software_listings' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bundles' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => onChange())
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function reloadFromSupabase() {
  setCacheHydrated(false);
  await hydrateStore();
}

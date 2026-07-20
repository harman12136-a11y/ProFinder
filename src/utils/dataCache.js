const cache = {
  hydrated: false,
  listings: [],
  messages: [],
  reviews: [],
  bundles: [],
  services: [],
  jobs: [],
  proposals: [],
  purchases: [],
  library: {},
  following: {},
  feedback: [],
  feedbackFlags: {},
  users: [],
};

export function isCacheHydrated() {
  return cache.hydrated;
}

export function setCacheHydrated(value) {
  cache.hydrated = value;
}

export function getCache() {
  return cache;
}

export function resetCache() {
  cache.hydrated = false;
  cache.listings = [];
  cache.messages = [];
  cache.reviews = [];
  cache.bundles = [];
  cache.services = [];
  cache.jobs = [];
  cache.proposals = [];
  cache.purchases = [];
  cache.library = {};
  cache.following = {};
  cache.feedback = [];
  cache.feedbackFlags = {};
  cache.users = [];
}

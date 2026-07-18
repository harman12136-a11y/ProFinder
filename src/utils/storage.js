const USERS_KEY = 'profinder_users';
const CURRENT_USER_KEY = 'profinder_current_user';
const SOFTWARE_KEY = 'profinder_software';

export function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
  try {
    return JSON.parse(localStorage.getItem(SOFTWARE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveSoftwareListings(listings) {
  localStorage.setItem(SOFTWARE_KEY, JSON.stringify(listings));
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
  listings.unshift(listing);
  saveSoftwareListings(listings);
  return listing;
}

export function getSoftwareById(id) {
  return getSoftwareListings().find((s) => s.id === id);
}

export function getUserListings(userId) {
  return getSoftwareListings().filter((s) => s.sellerId === userId);
}

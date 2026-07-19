export function isUserVerified(user) {
  if (!user?.verified) return false;
  const { email, phone, github } = user.verified;
  return Boolean(email && (phone || github));
}

export function getVerificationCount(user) {
  if (!user?.verified) return 0;
  return ['email', 'phone', 'github'].filter((k) => user.verified[k]).length;
}

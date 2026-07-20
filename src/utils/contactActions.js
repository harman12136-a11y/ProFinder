export function getManagePath(type, id) {
  switch (type) {
    case 'listing':
      return `/edit-software/${id}`;
    case 'service':
      return '/manage-service';
    case 'job':
      return `/job/${id}`;
    case 'profile':
      return '/settings';
    default:
      return '/dashboard';
  }
}

export function getMessagePath({ toUserId, contextId, contextTitle }) {
  const params = new URLSearchParams({ to: toUserId });
  if (contextId) params.set('product', contextId);
  if (contextTitle) params.set('title', contextTitle);
  return `/messages?${params.toString()}`;
}

export function navigateContact(navigate, {
  user,
  ownerId,
  type,
  id,
  toUserId,
  contextId,
  contextTitle,
}) {
  if (!user) {
    navigate('/login');
    return;
  }
  if (user.id === ownerId) {
    navigate(getManagePath(type, id));
    return;
  }
  navigate(getMessagePath({ toUserId, contextId, contextTitle }));
}

export function isOwner(user, ownerId) {
  return Boolean(user?.id && ownerId && user.id === ownerId);
}

import { getSoftwareById, getJobById, getServiceByUserId } from './storage';

export function resolveContextTitle(contextId, fallbackTitle) {
  if (fallbackTitle) return fallbackTitle;
  if (!contextId) return null;

  if (contextId.startsWith('service-')) {
    const userId = contextId.slice('service-'.length);
    const service = getServiceByUserId(userId);
    if (service) return `Service — ${service.name}`;
    return 'Service inquiry';
  }

  const listing = getSoftwareById(contextId);
  if (listing) return listing.title;

  const job = getJobById(contextId);
  if (job) return job.title;

  return null;
}

export function resolveContextLink(contextId) {
  if (!contextId) return null;

  if (contextId.startsWith('service-')) {
    return `/service/${contextId.slice('service-'.length)}`;
  }

  if (getJobById(contextId)) return `/job/${contextId}`;
  if (getSoftwareById(contextId)) return `/software/${contextId}`;

  return null;
}

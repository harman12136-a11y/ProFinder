import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSellerForService } from '../utils/storage';
import { SERVICE_PROFESSIONS } from '../utils/constants';
import VerifiedBadge from './VerifiedBadge';
import './ServiceCard.css';
import './VerifiedBadge.css';

function getProfessionLabel(service) {
  if (service.profession === 'other' && service.professionOther) return service.professionOther;
  return SERVICE_PROFESSIONS.find((p) => p.value === service.profession)?.label || service.profession;
}

export default function ServiceCard({ service, index = 0 }) {
  const user = getSellerForService(service);

  return (
    <motion.article
      className="service-card card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="service-card-avatar">{service.name?.charAt(0) || 'P'}</div>
      <div className="service-card-body">
        <div className="service-card-header">
          <Link to={`/service/${service.userId}`} className="service-card-name">{service.name}</Link>
          {user && <VerifiedBadge user={user} />}
        </div>
        <span className="service-card-profession">{getProfessionLabel(service)}</span>
        <p className="service-card-bio">{service.bio?.slice(0, 100)}{(service.bio?.length || 0) > 100 ? '...' : ''}</p>
        {service.degree && <span className="service-card-degree">{service.degree}</span>}
        <Link to={`/service/${service.userId}`} className="btn btn-outline service-card-btn">View Profile</Link>
      </div>
    </motion.article>
  );
}

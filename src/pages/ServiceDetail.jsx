import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VerifiedBadge from '../components/VerifiedBadge';
import { getServiceByUserId, getSellerForService, isServiceActive } from '../utils/storage';
import { SERVICE_PROFESSIONS, FREE_PUBLISH_MODE } from '../utils/constants';
import { formatIndianPhone } from '../utils/validation';
import { navigateContact, isOwner } from '../utils/contactActions';
import { useAuth } from '../hooks/useAuth';
import { Award, Briefcase, GraduationCap, MessageCircle, Settings } from 'lucide-react';
import './ServiceDetail.css';
import '../components/VerifiedBadge.css';

function getProfessionLabel(service) {
  if (service.profession === 'other' && service.professionOther) return service.professionOther;
  return SERVICE_PROFESSIONS.find((p) => p.value === service.profession)?.label || service.profession;
}

export default function ServiceDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const service = getServiceByUserId(userId);
  const profileUser = getSellerForService(service);
  const ownService = isOwner(user, userId);

  if (!service || (!isServiceActive(service) && !ownService)) {
    return (
      <div className="service-detail-page">
        <Navbar />
        <div className="page-container service-not-found">
          <h2>Professional not found</h2>
          <p>This profile may be inactive or not yet registered.</p>
          <Link to="/services" className="btn btn-primary">Browse Services</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleContact = () => {
    navigateContact(navigate, {
      user,
      ownerId: userId,
      type: 'service',
      id: userId,
      toUserId: userId,
      contextId: `service-${userId}`,
      contextTitle: `Service — ${getProfessionLabel(service)}`,
    });
  };

  return (
    <div className="service-detail-page">
      <Navbar />
      <div className="page-container service-detail-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="service-detail-header card">
            <div className="service-detail-avatar">{service.name?.charAt(0)}</div>
            <div className="service-detail-info">
              <div className="service-detail-name-row">
                <h1>{service.name}</h1>
                {profileUser && <VerifiedBadge user={profileUser} size="lg" />}
              </div>
              <span className="service-detail-profession">{getProfessionLabel(service)}</span>
              {service.experience && <p className="service-detail-exp">{service.experience} experience</p>}
              <p className="service-detail-bio">{service.bio}</p>
              <div className="service-detail-actions">
                <button type="button" className="btn btn-primary" onClick={handleContact}>
                  {ownService ? (
                    <><Settings size={18} /> Manage Profession</>
                  ) : (
                    <><MessageCircle size={18} /> Message</>
                  )}
                </button>
              </div>
              {!FREE_PUBLISH_MODE && !isServiceActive(service) && ownService && (
                <p className="service-detail-inactive">Your profile is hidden — renew subscription from Dashboard to go live.</p>
              )}
            </div>
          </div>

          <div className="service-detail-sections">
            {service.degree && (
              <div className="service-detail-section card">
                <h2><GraduationCap size={20} /> Qualification</h2>
                <p>{service.degree}</p>
              </div>
            )}

            {service.achievements && (
              <div className="service-detail-section card">
                <h2><Award size={20} /> Achievements</h2>
                <p>{service.achievements}</p>
              </div>
            )}

            <div className="service-detail-section card">
              <h2><Briefcase size={20} /> Services Offered</h2>
              <p>{service.servicesOffered}</p>
            </div>

            {service.phone && (
              <div className="service-detail-section card">
                <h2>Contact</h2>
                <p>{formatIndianPhone(service.phone)}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

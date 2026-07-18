import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getSoftwareById } from '../utils/storage';
import { formatINR, formatIndianPhone } from '../utils/validation';
import {
  ArrowLeft, Mail, Phone, ExternalLink, IndianRupee,
  User, Calendar, MessageCircle,
} from 'lucide-react';
import './SoftwareDetail.css';

export default function SoftwareDetail() {
  const { id } = useParams();
  const software = getSoftwareById(id);

  if (!software) {
    return (
      <div className="detail-page">
        <Navbar />
        <div className="page-container detail-not-found">
          <h2>Software not found</h2>
          <Link to="/marketplace" className="btn btn-primary">
            <ArrowLeft size={18} /> Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <Navbar />

      <div className="page-container detail-content">
        <Link to="/marketplace" className="detail-back">
          <ArrowLeft size={18} /> Back to Marketplace
        </Link>

        <div className="detail-grid">
          <motion.div
            className="detail-gallery"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {software.photos?.length > 0 ? (
              <div className="detail-photos">
                <img src={software.photos[0]} alt={software.title} className="detail-main-photo" />
                {software.photos.length > 1 && (
                  <div className="detail-photo-grid">
                    {software.photos.slice(1).map((photo, i) => (
                      <img key={i} src={photo} alt={`${software.title} ${i + 2}`} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="detail-no-photo card">
                <span>{software.title.charAt(0)}</span>
              </div>
            )}

            {software.videos?.length > 0 && (
              <div className="detail-videos">
                <h3>Demo Videos</h3>
                {software.videos.map((video, i) => (
                  <video key={i} src={video} controls className="detail-video" />
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            className="detail-info"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="detail-price-badge">
              <IndianRupee size={20} />
              {formatINR(software.price)}
            </div>

            <h1 className="detail-title">{software.title}</h1>
            <p className="detail-desc">{software.description}</p>

            {software.about && (
              <div className="detail-about card">
                <h3>About this Software</h3>
                <p>{software.about}</p>
              </div>
            )}

            {software.url && (
              <a href={software.url} target="_blank" rel="noopener noreferrer" className="detail-url">
                <ExternalLink size={16} />
                View Software / Demo
              </a>
            )}

            <div className="detail-contact card">
              <h3>
                <MessageCircle size={20} />
                Contact Seller
              </h3>
              <p className="detail-contact-note">
                Interested? Reach out to the seller directly. Purchases are handled off-platform.
              </p>

              <div className="detail-contact-items">
                <div className="detail-contact-item">
                  <User size={18} />
                  <div>
                    <span className="contact-label">Seller</span>
                    <span className="contact-value">{software.sellerName}</span>
                  </div>
                </div>

                <a href={`mailto:${software.contactEmail}`} className="detail-contact-item contact-link">
                  <Mail size={18} />
                  <div>
                    <span className="contact-label">Email</span>
                    <span className="contact-value">{software.contactEmail}</span>
                  </div>
                </a>

                <a href={`tel:${software.contactPhone.replace(/\s/g, '')}`} className="detail-contact-item contact-link">
                  <Phone size={18} />
                  <div>
                    <span className="contact-label">Phone</span>
                    <span className="contact-value">{formatIndianPhone(software.contactPhone)}</span>
                  </div>
                </a>
              </div>

              <div className="detail-contact-actions">
                <a href={`mailto:${software.contactEmail}?subject=Interested in ${software.title}`} className="btn btn-primary">
                  <Mail size={18} /> Send Email
                </a>
                <a href={`tel:${software.contactPhone.replace(/\s/g, '')}`} className="btn btn-outline">
                  <Phone size={18} /> Call Seller
                </a>
              </div>
            </div>

            <div className="detail-meta">
              <Calendar size={14} />
              Listed on {new Date(software.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

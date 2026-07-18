import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, IndianRupee } from 'lucide-react';
import { formatINR } from '../utils/validation';
import './SoftwareCard.css';

export default function SoftwareCard({ software, index = 0 }) {
  const thumbnail = software.photos?.[0] || null;

  return (
    <motion.div
      className="software-card card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -6 }}
    >
      <Link to={`/software/${software.id}`} className="software-card-link">
        <div className="software-card-image">
          {thumbnail ? (
            <img src={thumbnail} alt={software.title} />
          ) : (
            <div className="software-card-placeholder">
              <span>{software.title.charAt(0)}</span>
            </div>
          )}
          <div className="software-card-price">
            <IndianRupee size={14} />
            {formatINR(software.price).replace('₹', '')}
          </div>
        </div>
        <div className="software-card-body">
          <h3>{software.title}</h3>
          <p>{software.description.slice(0, 100)}{software.description.length > 100 ? '...' : ''}</p>
          <div className="software-card-meta">
            <span className="software-card-seller">{software.sellerName}</span>
            <span className="software-card-contact">
              <ExternalLink size={14} />
              Contact Seller
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

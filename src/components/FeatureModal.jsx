import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Shield } from 'lucide-react';
import { formatINR } from '../utils/validation';
import { FEATURE_FEE, FEATURE_DAYS } from '../utils/constants';
import './PaymentModal.css';

export default function FeatureModal({ isOpen, onClose, onSuccess, productTitle }) {
  const [step, setStep] = useState('confirm');

  const handlePay = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
        setStep('confirm');
      }, 1500);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="payment-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
        <motion.div className="payment-modal card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()}>
          <button className="payment-close" onClick={onClose}><X size={20} /></button>

          {step === 'confirm' && (
            <div className="payment-content">
              <div className="payment-icon"><Sparkles size={32} /></div>
              <h2>Feature Your Listing</h2>
              <p className="payment-desc">Get &quot;{productTitle}&quot; on the homepage for {FEATURE_DAYS} days</p>
              <div className="payment-amount">{formatINR(FEATURE_FEE)}</div>
              <div className="payment-secure"><Shield size={16} /> Featured badge + homepage placement</div>
              <button className="btn btn-primary payment-btn" onClick={handlePay}>Feature for {FEATURE_DAYS} days</button>
            </div>
          )}
          {step === 'processing' && (
            <div className="payment-content">
              <div className="payment-processing"><div className="payment-spinner" /><h2>Processing...</h2></div>
            </div>
          )}
          {step === 'success' && (
            <div className="payment-content">
              <div className="payment-success-icon">✓</div>
              <h2>Now Featured!</h2>
              <p>Your listing is live on the homepage.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

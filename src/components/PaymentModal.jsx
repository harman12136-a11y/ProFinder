import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Shield } from 'lucide-react';
import { formatINR } from '../utils/validation';
import './PaymentModal.css';

const LISTING_FEE = 100;

export default function PaymentModal({ isOpen, onClose, onSuccess }) {
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
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="payment-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="payment-modal card"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="payment-close" onClick={onClose}>
            <X size={20} />
          </button>

          {step === 'confirm' && (
            <div className="payment-content">
              <div className="payment-icon">
                <CreditCard size={32} />
              </div>
              <h2>Complete Payment</h2>
              <p className="payment-desc">
                Confirm payment to publish your listing on Profinder
              </p>
              <div className="payment-amount">
                {formatINR(LISTING_FEE)}
              </div>
              <div className="payment-methods">
                <span className="payment-method-badge">UPI</span>
                <span className="payment-method-badge">Cards</span>
                <span className="payment-method-badge">Net Banking</span>
              </div>
              <div className="payment-secure">
                <Shield size={16} />
                Secured payment
              </div>
              <button className="btn btn-primary payment-btn" onClick={handlePay}>
                Confirm Payment
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="payment-content">
              <div className="payment-processing">
                <div className="payment-spinner" />
                <h2>Processing Payment...</h2>
                <p>Please wait while we confirm your payment</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <motion.div
              className="payment-content"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <div className="payment-success-icon">✓</div>
              <h2>Payment Successful!</h2>
              <p>Your listing is being published...</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

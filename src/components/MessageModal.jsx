import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sendMessage } from '../utils/storage';
import './MessageModal.css';

export default function MessageModal({ isOpen, onClose, seller, product }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState(product ? `Interested in ${product.title}` : '');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!user || !body.trim()) return;
    sendMessage({
      fromUserId: user.id,
      fromUserName: user.name,
      toUserId: seller.id,
      productId: product?.id,
      productTitle: product?.title,
      subject: subject || `Message about ${product?.title || 'your listing'}`,
      body: body.trim(),
    });
    setSent(true);
    setTimeout(() => {
      onClose();
      setSent(false);
      setBody('');
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="msg-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
        <motion.div
          className="msg-modal card"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="msg-close" onClick={onClose}><X size={20} /></button>
          <h2>Message {seller.name}</h2>
          <p className="msg-sub">Your contact details stay private until you choose to share them.</p>

          {sent ? (
            <div className="msg-sent">Message sent successfully!</div>
          ) : (
            <form onSubmit={handleSend}>
              <div className="form-group">
                <label>Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} required placeholder="Hi, I'm interested in your software..." />
              </div>
              <button type="submit" className="btn btn-primary msg-send">
                <Send size={16} /> Send Message
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

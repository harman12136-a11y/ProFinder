import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { getUserListings, addBundle } from '../utils/storage';
import { formatINR } from '../utils/validation';
import './CreateBundle.css';

export default function CreateBundle() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const listings = getUserListings(user.id);
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState([]);
  const [bundlePrice, setBundlePrice] = useState('');

  const originalTotal = selected.reduce((sum, id) => {
    const item = listings.find((l) => l.id === id);
    return sum + (item?.price || 0);
  }, 0);

  const toggle = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (selected.length < 2) return;
    const bundle = {
      id: crypto.randomUUID(),
      sellerId: user.id,
      sellerName: user.name,
      title: title.trim(),
      productIds: selected,
      originalPrice: originalTotal,
      price: Number(bundlePrice),
      createdAt: new Date().toISOString(),
    };
    addBundle(bundle);
    navigate('/dashboard');
  };

  return (
    <div className="bundle-page">
      <Navbar />
      <div className="page-container bundle-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-title">Create <span className="gradient-text">Bundle</span></h1>
          <p className="section-subtitle">Combine multiple products at a discounted price.</p>

          <form className="bundle-form card" onSubmit={handleCreate}>
            <div className="form-group">
              <label htmlFor="title">Bundle Title</label>
              <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Full Stack Dev Kit" required />
            </div>

            <fieldset className="form-group bundle-fieldset">
              <legend>Select Products (min. 2)</legend>
              <div className="bundle-products">
                {listings.map((item) => (
                  <label key={item.id} className={`bundle-product-item ${selected.includes(item.id) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
                    <span>{item.title}</span>
                    <span>{formatINR(item.price)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {selected.length >= 2 && (
              <>
                <p className="bundle-original">Original total: <strong>{formatINR(originalTotal)}</strong></p>
                <div className="form-group">
                  <label htmlFor="bundlePrice">Bundle Price (INR)</label>
                  <input id="bundlePrice" type="number" value={bundlePrice} onChange={(e) => setBundlePrice(e.target.value)} min="1" max={originalTotal - 1} required />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" disabled={selected.length < 2}>
              Create Bundle
            </button>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

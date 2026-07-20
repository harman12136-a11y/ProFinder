import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../hooks/useAuth';
import { addSoftwareListing, activateSubscription } from '../utils/storage';
import { FREE_PUBLISH_MODE } from '../utils/constants';
import { validateEmail, validateIndianPhone, validateUrl, normalizeUrl } from '../utils/validation';
import { CATEGORIES } from '../utils/categories';
import { LICENSES } from '../utils/constants';
import { Upload, X, IndianRupee, Link as LinkIcon } from 'lucide-react';
import './ListSoftware.css';

export default function ListSoftware() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPayment, setShowPayment] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    title: '',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
    url: '',
    description: '',
    about: '',
    price: '',
    category: CATEGORIES[0],
    license: 'MIT',
    demoUrl: '',
    builtWithIndia: false,
    photos: [],
    videos: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setErrors({ ...errors, [name]: '' });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((prev) => ({
          ...prev,
          photos: [...prev.photos, ev.target.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((prev) => ({
          ...prev,
          videos: [...prev.videos, ev.target.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setForm({ ...form, photos: form.photos.filter((_, i) => i !== index) });
  };

  const removeVideo = (index) => {
    setForm({ ...form, videos: form.videos.filter((_, i) => i !== index) });
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!validateEmail(form.contactEmail)) newErrors.contactEmail = 'Valid email required';
    if (!validateIndianPhone(form.contactPhone)) newErrors.contactPhone = 'Valid Indian phone required';
    if (form.demoUrl.trim() && !validateUrl(form.demoUrl)) newErrors.demoUrl = 'Enter a valid demo URL';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.about.trim()) newErrors.about = 'About section is required';
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'Valid price required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handlePublish = () => {
    if (FREE_PUBLISH_MODE) {
      void handlePaymentSuccess();
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    const listing = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      url: normalizeUrl(form.url),
      description: form.description.trim(),
      about: form.about.trim(),
      price: Number(form.price),
      category: form.category,
      license: form.license,
      demoUrl: normalizeUrl(form.demoUrl),
      builtWithIndia: form.builtWithIndia,
      photos: form.photos,
      videos: form.videos,
      sellerId: user.id,
      sellerName: user.name,
      createdAt: new Date().toISOString(),
      paid: true,
    };

    setPublishing(true);
    setErrors({});
    try {
      await addSoftwareListing(listing);
      const updated = activateSubscription(user.id);
      if (updated) updateUser({ subscriptionExpiresAt: updated.subscriptionExpiresAt });
      navigate(`/software/${listing.id}`);
    } catch (err) {
      setErrors({ publish: err.message || 'Failed to publish. Please try again.' });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="list-page">
      <Navbar />

      <div className="page-container list-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="section-title">
            Create a <span className="gradient-text">Product</span>
          </h1>
          <p className="section-subtitle list-subtitle">
            Publish your software to your Profinds storefront.
          </p>

          <div className="list-steps">
            <div className={`list-step-indicator ${step >= 1 ? 'active' : ''}`}>
              <span>1</span> Details
            </div>
            <div className="list-step-line" />
            <div className={`list-step-indicator ${step >= 2 ? 'active' : ''}`}>
              <span>2</span> Media &amp; Publish
            </div>
          </div>

          {step === 1 && (
            <motion.div
              className="list-form card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="form-group">
                <label htmlFor="title">Software Title</label>
                <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g. React Dashboard Template" />
                {errors.title && <span className="form-error">{errors.title}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contactEmail">Contact Email</label>
                  <input id="contactEmail" name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} placeholder="seller@email.com" />
                  {errors.contactEmail && <span className="form-error">{errors.contactEmail}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="contactPhone">Contact Phone (Indian)</label>
                  <input id="contactPhone" name="contactPhone" type="tel" value={form.contactPhone} onChange={handleChange} placeholder="+91 98765 43210" />
                  {errors.contactPhone && <span className="form-error">{errors.contactPhone}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="license">License Type</label>
                <select id="license" name="license" value={form.license} onChange={handleChange}>
                  {LICENSES.map((l) => <option key={l.value} value={l.value}>{l.label} — {l.desc}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="demoUrl">Live Demo URL</label>
                <input id="demoUrl" name="demoUrl" value={form.demoUrl} onChange={handleChange} placeholder="demo.yoursite.com" />
                {errors.demoUrl && <span className="form-error">{errors.demoUrl}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="url">Website URL (optional)</label>
                <div className="input-with-icon">
                  <LinkIcon size={18} />
                  <input id="url" name="url" value={form.url} onChange={handleChange} placeholder="yoursite.com" />
                </div>
                {errors.url && <span className="form-error">{errors.url}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Short Description</label>
                <textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Brief overview of your software..." />
                {errors.description && <span className="form-error">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="about">About the Software</label>
                <textarea id="about" name="about" value={form.about} onChange={handleChange} placeholder="Detailed description, features, tech stack, use cases..." rows={5} />
                {errors.about && <span className="form-error">{errors.about}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Pricing (INR)</label>
                <div className="input-with-icon">
                  <IndianRupee size={18} />
                  <input id="price" name="price" type="number" value={form.price} onChange={handleChange} placeholder="999" min="1" />
                </div>
                {errors.price && <span className="form-error">{errors.price}</span>}
              </div>

              <label className="checkbox-label">
                <input type="checkbox" name="builtWithIndia" checked={form.builtWithIndia} onChange={handleChange} />
                <span>🇮🇳 Built With India — for GST tools, billing, regional language support, etc.</span>
              </label>

              <button className="btn btn-primary list-next" onClick={handleNext}>
                Continue to Media
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              className="list-form card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="form-group">
                <p className="form-group-label">Photos</p>
                <div className="upload-area">
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} id="photo-upload" hidden />
                  <label htmlFor="photo-upload" className="upload-btn">
                    <Upload size={20} />
                    Upload Photos
                  </label>
                </div>
                {form.photos.length > 0 && (
                  <div className="media-preview">
                    {form.photos.map((photo, i) => (
                      <div key={i} className="media-preview-item">
                        <img src={photo} alt={`Preview ${i + 1}`} />
                        <button type="button" onClick={() => removePhoto(i)} className="media-remove">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <p className="form-group-label">Videos</p>
                <div className="upload-area">
                  <input type="file" accept="video/*" multiple onChange={handleVideoUpload} id="video-upload" hidden />
                  <label htmlFor="video-upload" className="upload-btn">
                    <Upload size={20} />
                    Upload Videos
                  </label>
                </div>
                {form.videos.length > 0 && (
                  <div className="media-preview">
                    {form.videos.map((video, i) => (
                      <div key={i} className="media-preview-item video">
                        <video src={video}>
                          <track kind="captions" label="No captions available" />
                        </video>
                        <button type="button" onClick={() => removeVideo(i)} className="media-remove">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!FREE_PUBLISH_MODE && (
                <div className="list-publish-notice card">
                  <div>
                    <strong>Ready to publish?</strong>
                    <p>Complete payment to make your listing live on the marketplace.</p>
                  </div>
                </div>
              )}

              {errors.publish && <span className="form-error">{errors.publish}</span>}

              <div className="list-actions">
                <button className="btn btn-outline" onClick={() => setStep(1)} disabled={publishing}>Back</button>
                <button className="btn btn-primary" onClick={handlePublish} disabled={publishing}>
                  {publishing ? 'Publishing…' : 'Publish Listing'}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {!FREE_PUBLISH_MODE && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          amount={100}
          title="Listing Fee"
          description="Includes 1 month active listing for your product and professional profile"
          successText="Listing published!"
        />
      )}

      <Footer />
    </div>
  );
}

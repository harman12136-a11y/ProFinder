import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { getSoftwareById, updateSoftwareListing } from '../utils/storage';
import { validateEmail, validateIndianPhone, validateUrl, normalizeUrl } from '../utils/validation';
import { CATEGORIES } from '../utils/categories';
import { LICENSES } from '../utils/constants';
import { Upload, X, IndianRupee, Link as LinkIcon } from 'lucide-react';
import './ListSoftware.css';

export default function EditSoftware() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const existing = getSoftwareById(id);

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => ({
    title: existing?.title || '',
    contactEmail: existing?.contactEmail || user?.email || '',
    contactPhone: existing?.contactPhone || user?.phone || '',
    url: existing?.url || '',
    description: existing?.description || '',
    about: existing?.about || '',
    price: existing?.price?.toString() || '',
    category: existing?.category || CATEGORIES[0],
    license: existing?.license || 'MIT',
    demoUrl: existing?.demoUrl || '',
    builtWithIndia: existing?.builtWithIndia || false,
    photos: existing?.photos || [],
    videos: existing?.videos || [],
  }));

  if (!existing || existing.sellerId !== user?.id) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setErrors({ ...errors, [name]: '' });
  };

  const handlePhotoUpload = (e) => {
    Array.from(e.target.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((prev) => ({ ...prev, photos: [...prev.photos, ev.target.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e) => {
    Array.from(e.target.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((prev) => ({ ...prev, videos: [...prev.videos, ev.target.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!validateEmail(form.contactEmail)) newErrors.contactEmail = 'Valid email required';
    if (!validateIndianPhone(form.contactPhone)) newErrors.contactPhone = 'Valid Indian phone required';
    if (form.demoUrl.trim() && !validateUrl(form.demoUrl)) newErrors.demoUrl = 'Enter a valid demo URL';
    if (form.url.trim() && !validateUrl(form.url)) newErrors.url = 'Enter a valid URL';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.about.trim()) newErrors.about = 'About section is required';
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'Valid price required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    updateSoftwareListing(id, {
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
      sellerName: user.name,
      updatedAt: new Date().toISOString(),
    });
    navigate(`/software/${id}`);
  };

  return (
    <div className="list-page">
      <Navbar />
      <div className="page-container list-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-title">Edit <span className="gradient-text">Listing</span></h1>
          <p className="section-subtitle list-subtitle">Update your product details and media.</p>

          <div className="list-steps">
            <div className={`list-step-indicator ${step >= 1 ? 'active' : ''}`}><span>1</span> Details</div>
            <div className="list-step-line" />
            <div className={`list-step-indicator ${step >= 2 ? 'active' : ''}`}><span>2</span> Media</div>
          </div>

          {step === 1 && (
            <motion.div className="list-form card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="form-group">
                <label htmlFor="title">Software Title</label>
                <input id="title" name="title" value={form.title} onChange={handleChange} />
                {errors.title && <span className="form-error">{errors.title}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contactEmail">Contact Email</label>
                  <input id="contactEmail" name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} />
                  {errors.contactEmail && <span className="form-error">{errors.contactEmail}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="contactPhone">Contact Phone</label>
                  <input id="contactPhone" name="contactPhone" type="tel" value={form.contactPhone} onChange={handleChange} />
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
                <input id="demoUrl" name="demoUrl" value={form.demoUrl} onChange={handleChange} />
                {errors.demoUrl && <span className="form-error">{errors.demoUrl}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="url">Website URL (optional)</label>
                <div className="input-with-icon">
                  <LinkIcon size={18} />
                  <input id="url" name="url" value={form.url} onChange={handleChange} />
                </div>
                {errors.url && <span className="form-error">{errors.url}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="description">Short Description</label>
                <textarea id="description" name="description" value={form.description} onChange={handleChange} />
                {errors.description && <span className="form-error">{errors.description}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="about">About the Software</label>
                <textarea id="about" name="about" value={form.about} onChange={handleChange} rows={5} />
                {errors.about && <span className="form-error">{errors.about}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="price">Pricing (INR)</label>
                <div className="input-with-icon">
                  <IndianRupee size={18} />
                  <input id="price" name="price" type="number" value={form.price} onChange={handleChange} min="1" />
                </div>
                {errors.price && <span className="form-error">{errors.price}</span>}
              </div>
              <label className="checkbox-label">
                <input type="checkbox" name="builtWithIndia" checked={form.builtWithIndia} onChange={handleChange} />
                <span>🇮🇳 Built With India — for GST tools, billing, regional language support, etc.</span>
              </label>
              <button type="button" className="btn btn-primary list-next" onClick={() => validateStep1() && setStep(2)}>
                Continue to Media
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div className="list-form card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="form-group">
                <label>Photos</label>
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} id="photo-upload" hidden />
                <label htmlFor="photo-upload" className="upload-btn"><Upload size={20} /> Upload Photos</label>
                {form.photos.length > 0 && (
                  <div className="media-preview">
                    {form.photos.map((photo, i) => (
                      <div key={i} className="media-preview-item">
                        <img src={photo} alt={`Preview ${i + 1}`} />
                        <button type="button" onClick={() => setForm({ ...form, photos: form.photos.filter((_, idx) => idx !== i) })} className="media-remove"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Videos</label>
                <input type="file" accept="video/*" multiple onChange={handleVideoUpload} id="video-upload" hidden />
                <label htmlFor="video-upload" className="upload-btn"><Upload size={20} /> Upload Videos</label>
                {form.videos.length > 0 && (
                  <div className="media-preview">
                    {form.videos.map((video, i) => (
                      <div key={i} className="media-preview-item video">
                        <video src={video} />
                        <button type="button" onClick={() => setForm({ ...form, videos: form.videos.filter((_, idx) => idx !== i) })} className="media-remove"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="list-actions">
                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
                <button type="button" className="btn btn-primary" onClick={handleSave}>Save Changes</button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

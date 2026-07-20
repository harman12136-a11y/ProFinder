import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { getServiceByUserId, updateServiceProfile, deleteServiceProfile } from '../utils/storage';
import { SERVICE_PROFESSIONS, FREE_PUBLISH_MODE } from '../utils/constants';
import './RegisterService.css';

export default function ManageService() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const existing = getServiceByUserId(user.id);

  const [form, setForm] = useState(() => ({
    profession: existing?.profession || SERVICE_PROFESSIONS[0].value,
    professionOther: existing?.professionOther || '',
    degree: existing?.degree || '',
    achievements: existing?.achievements || '',
    bio: existing?.bio || '',
    experience: existing?.experience || '',
    servicesOffered: existing?.servicesOffered || '',
  }));
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  if (!existing || (!FREE_PUBLISH_MODE && !existing.registrationPaid)) {
    return <Navigate to="/register-service" replace />;
  }

  const isOther = form.profession === 'other';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setSaved(false);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.bio.trim()) newErrors.bio = 'Bio is required';
    if (!form.servicesOffered.trim()) newErrors.servicesOffered = 'Describe your services';
    if (isOther && !form.professionOther.trim()) newErrors.professionOther = 'Describe your profession';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    updateServiceProfile(user.id, {
      profession: form.profession,
      professionOther: isOther ? form.professionOther.trim() : '',
      degree: form.degree.trim(),
      achievements: form.achievements.trim(),
      bio: form.bio.trim(),
      experience: form.experience.trim(),
      servicesOffered: form.servicesOffered.trim(),
    });
    setSaved(true);
  };

  const handleDelete = () => {
    if (!window.confirm('Remove your professional profile? You can register again later.')) return;
    deleteServiceProfile(user.id);
    navigate('/dashboard');
  };

  return (
    <div className="register-service-page">
      <Navbar />
      <div className="page-container register-service-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-title">Manage <span className="gradient-text">Profession</span></h1>
          <p className="section-subtitle">Update your professional profile and services listing.</p>

          <form className="register-service-form card" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="profession">Profession</label>
              <select id="profession" name="profession" value={form.profession} onChange={handleChange}>
                {SERVICE_PROFESSIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {isOther && (
              <div className="form-group">
                <label htmlFor="professionOther">Describe Your Profession</label>
                <input
                  id="professionOther"
                  name="professionOther"
                  value={form.professionOther}
                  onChange={handleChange}
                  placeholder="e.g. Graphic Designer, Legal Consultant, Tutor..."
                />
                {errors.professionOther && <span className="form-error">{errors.professionOther}</span>}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="degree">
                Degree / Qualification <span className="optional-tag">(optional)</span>
              </label>
              <input
                id="degree"
                name="degree"
                value={form.degree}
                onChange={handleChange}
                placeholder="e.g. B.Com, CA, B.Tech"
              />
            </div>

            <div className="form-group">
              <label htmlFor="achievements">
                Achievements <span className="optional-tag">(optional)</span>
              </label>
              <textarea
                id="achievements"
                name="achievements"
                value={form.achievements}
                onChange={handleChange}
                placeholder="Awards, certifications, notable clients..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="experience">Years of Experience</label>
              <input
                id="experience"
                name="experience"
                value={form.experience}
                onChange={handleChange}
                placeholder="e.g. 5+ years"
              />
            </div>

            <div className="form-group">
              <label htmlFor="servicesOffered">Services You Offer</label>
              <textarea
                id="servicesOffered"
                name="servicesOffered"
                value={form.servicesOffered}
                onChange={handleChange}
                placeholder="Describe what clients can hire you for..."
                rows={3}
              />
              {errors.servicesOffered && <span className="form-error">{errors.servicesOffered}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="bio">Professional Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell potential clients about yourself..."
                rows={4}
              />
              {errors.bio && <span className="form-error">{errors.bio}</span>}
            </div>

            <div className="manage-service-actions">
              <button type="submit" className="btn btn-primary">Save Changes</button>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>Cancel</button>
              <button type="button" className="btn btn-outline manage-delete" onClick={handleDelete}>Remove Profile</button>
            </div>
            {saved && <p className="manage-saved">Profession updated successfully.</p>}
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

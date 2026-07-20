import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../hooks/useAuth';
import { getServiceByUserId, registerServiceProfile, getUserById } from '../utils/storage';
import { SERVICE_PROFESSIONS, SERVICE_REGISTRATION_FEE, SERVICE_MONTHLY_FEE, FREE_PUBLISH_MODE } from '../utils/constants';
import { formatINR } from '../utils/validation';
import './RegisterService.css';

export default function RegisterService() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const existing = getServiceByUserId(user.id);

  const [form, setForm] = useState({
    profession: SERVICE_PROFESSIONS[0].value,
    professionOther: '',
    degree: '',
    achievements: '',
    bio: '',
    experience: '',
    servicesOffered: '',
  });
  const [errors, setErrors] = useState({});
  const [showPayment, setShowPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (existing && (existing.registrationPaid || FREE_PUBLISH_MODE)) {
    return <Navigate to="/manage-service" replace />;
  }

  const isOther = form.profession === 'other';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
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
    if (FREE_PUBLISH_MODE) {
      void handlePaymentSuccess();
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      await registerServiceProfile({
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profession: form.profession,
        professionOther: isOther ? form.professionOther.trim() : '',
        degree: form.degree.trim(),
        achievements: form.achievements.trim(),
        bio: form.bio.trim(),
        experience: form.experience.trim(),
        servicesOffered: form.servicesOffered.trim(),
      });
      const refreshed = getUserById(user.id);
      if (refreshed?.subscriptionExpiresAt) {
        updateUser({ subscriptionExpiresAt: refreshed.subscriptionExpiresAt });
      }
      navigate('/dashboard');
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to register. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-service-page">
      <Navbar />
      <div className="page-container register-service-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-title">Register as a <span className="gradient-text">Professional</span></h1>
          {!FREE_PUBLISH_MODE && (
            <p className="section-subtitle">
              {formatINR(SERVICE_REGISTRATION_FEE)} includes 1 month active listing for your products &amp; services. Then {formatINR(SERVICE_MONTHLY_FEE)}/month to renew.
            </p>
          )}

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

            {!FREE_PUBLISH_MODE && (
              <div className="register-pricing card">
                <h3>Pricing</h3>
                <div className="pricing-row">
                  <span>One-time registration (includes 1 month active)</span>
                  <strong>{formatINR(SERVICE_REGISTRATION_FEE)}</strong>
                </div>
                <div className="pricing-row">
                  <span>Monthly renewal (products + services)</span>
                  <strong>{formatINR(SERVICE_MONTHLY_FEE)}/mo</strong>
                </div>
              </div>
            )}

            {errors.submit && <span className="form-error">{errors.submit}</span>}

            <button type="submit" className="btn btn-primary register-submit" disabled={submitting}>
              {submitting
                ? 'Registering…'
                : FREE_PUBLISH_MODE
                  ? 'Register'
                  : `Pay ${formatINR(SERVICE_REGISTRATION_FEE)} & Register`}
            </button>
          </form>
        </motion.div>
      </div>

      {!FREE_PUBLISH_MODE && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          amount={SERVICE_REGISTRATION_FEE}
          title="Registration Fee"
          description="Includes 1 month active listing for your products and professional profile"
          successText="Registration complete!"
        />
      )}

      <Footer />
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VerifiedBadge from '../components/VerifiedBadge';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile, verifyUserField } from '../utils/storage';
import { isUserVerified, getVerificationCount } from '../utils/verification';
import { Mail, Phone, Code2, BadgeCheck } from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '', phone: user.phone || '' });
  const [github, setGithub] = useState(user.githubUsername || '');
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUserProfile(user.id, form);
    updateUser(form);
    setSaved(true);
  };

  const verify = (field, extra = {}) => {
    verifyUserField(user.id, field, extra);
    const updated = { ...user, verified: { ...(user.verified || {}), [field]: true }, ...extra };
    if (field === 'github') updated.githubUsername = github;
    updateUser(updated);
    setMsg(`${field.charAt(0).toUpperCase() + field.slice(1)} verified successfully!`);
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="settings-page">
      <Navbar />
      <div className="page-container settings-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-title">Profile <span className="gradient-text">Settings</span></h1>
          <p className="section-subtitle">Customize your storefront and verify your identity.</p>

          <div className="verify-card card">
            <div className="verify-card-header">
              <h2><BadgeCheck size={20} /> Developer Verification</h2>
              {isUserVerified(user) ? <VerifiedBadge user={user} size="lg" /> : (
                <span className="verify-progress">{getVerificationCount(user)}/3 verified</span>
              )}
            </div>
            <p className="verify-desc">Verify your identity to earn a trusted seller badge. Email + phone or GitHub required.</p>

            <div className="verify-items">
              <div className="verify-item">
                <Mail size={18} />
                <div>
                  <strong>Email</strong>
                  <span>{user.email}</span>
                </div>
                {user.verified?.email ? (
                  <span className="verify-done">Verified</span>
                ) : (
                  <button type="button" className="btn btn-outline" onClick={() => verify('email')}>Verify</button>
                )}
              </div>
              <div className="verify-item">
                <Phone size={18} />
                <div>
                  <strong>Phone</strong>
                  <span>{user.phone || 'Not set'}</span>
                </div>
                {user.verified?.phone ? (
                  <span className="verify-done">Verified</span>
                ) : (
                  <button type="button" className="btn btn-outline" onClick={() => verify('phone')} disabled={!user.phone}>Verify</button>
                )}
              </div>
              <div className="verify-item">
                <Code2 size={18} />
                <div>
                  <strong>GitHub</strong>
                  {user.verified?.github ? (
                    <span>@{user.githubUsername}</span>
                  ) : (
                    <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="username" className="verify-github-input" />
                  )}
                </div>
                {user.verified?.github ? (
                  <span className="verify-done">Verified</span>
                ) : (
                  <button type="button" className="btn btn-outline" onClick={() => verify('github', { githubUsername: github })} disabled={!github.trim()}>Verify</button>
                )}
              </div>
            </div>
            {msg && <p className="settings-saved">{msg}</p>}
          </div>

          <form className="settings-form card" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Display Name</label>
              <input id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea id="bio" name="bio" value={form.bio} onChange={handleChange} placeholder="Tell buyers about your work..." rows={4} />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary">Save Profile</button>
            {saved && <p className="settings-saved">Profile updated successfully.</p>}
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

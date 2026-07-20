import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../utils/storage';
import { Camera, X, Plus, Sparkles, Briefcase, Link2, Trash2 } from 'lucide-react';
import './Settings.css';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const emptyWork = { title: '', description: '', image: '', link: '' };

export default function Settings() {
  const { user, updateUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    skills: Array.isArray(user?.skills) ? user.skills : [],
    portfolio: Array.isArray(user?.portfolio) ? user.portfolio : [],
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [work, setWork] = useState(emptyWork);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const avatarInputRef = useRef(null);
  const workInputRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const readImage = (file, onDone) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image is too large. Please pick one under 2MB.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => onDone(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e) => {
    readImage(e.target.files[0], (dataUrl) => {
      setForm((prev) => ({ ...prev, avatar: dataUrl }));
      setSaved(false);
    });
  };

  const removeAvatar = () => {
    setForm((prev) => ({ ...prev, avatar: '' }));
    setSaved(false);
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !form.skills.includes(skill) && form.skills.length < 15) {
      setForm({ ...form, skills: [...form.skills, skill] });
      setSaved(false);
    }
    setSkillInput('');
  };

  const handleSkillKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  const removeSkill = (skill) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
    setSaved(false);
  };

  const handleWorkImage = (e) => {
    readImage(e.target.files[0], (dataUrl) => setWork((prev) => ({ ...prev, image: dataUrl })));
  };

  const addWork = () => {
    if (!work.title.trim()) {
      setError('Give your work a title before adding it.');
      return;
    }
    if (form.portfolio.length >= 12) {
      setError('You can showcase up to 12 items.');
      return;
    }
    setError('');
    const item = { id: crypto.randomUUID(), ...work, title: work.title.trim() };
    setForm({ ...form, portfolio: [...form.portfolio, item] });
    setWork(emptyWork);
    if (workInputRef.current) workInputRef.current.value = '';
    setSaved(false);
  };

  const removeWork = (id) => {
    setForm({ ...form, portfolio: form.portfolio.filter((p) => p.id !== id) });
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return;
    updateUserProfile(user.id, form);
    updateUser(form);
    setSaved(true);
  };

  const handleDeleteProfile = async () => {
    if (!user || deleting) return;

    const confirmed = window.confirm(
      'Delete your profile permanently? All your listings, services, jobs, and messages will be removed.'
    );
    if (!confirmed) return;

    const typed = window.prompt('Type DELETE to confirm account removal');
    if (typed !== 'DELETE') return;

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount();
      navigate('/');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete profile. Please try again.');
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="settings-page">
      <Navbar />
      <div className="page-container settings-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-title">Profile <span className="gradient-text">Settings</span></h1>
          <p className="section-subtitle">Customize your storefront and profile.</p>

          <form className="settings-form card" onSubmit={handleSubmit}>
            <div className="avatar-field">
              <div className="avatar-preview">
                {form.avatar ? (
                  <img src={form.avatar} alt="Profile" />
                ) : (
                  <span>{form.name.charAt(0) || '?'}</span>
                )}
              </div>
              <div className="avatar-controls">
                <label htmlFor="settings-avatar-upload">Profile Picture</label>
                <p className="avatar-hint">Square image, under 2MB works best.</p>
                <div className="avatar-buttons">
                  <button type="button" className="btn btn-outline" onClick={() => avatarInputRef.current?.click()}>
                    <Camera size={16} /> {form.avatar ? 'Change' : 'Upload'}
                  </button>
                  {form.avatar && (
                    <button type="button" className="btn btn-ghost" onClick={removeAvatar}>Remove</button>
                  )}
                </div>
                <input id="settings-avatar-upload" ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
              </div>
            </div>

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

            <div className="form-group">
              <label htmlFor="settings-skill-input"><Sparkles size={16} className="inline-icon" /> Skills</label>
              <div className="skill-input-row">
                <input
                  id="settings-skill-input"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKey}
                  placeholder="e.g. React, Node.js, UI Design"
                />
                <button type="button" className="btn btn-outline skill-add-btn" onClick={addSkill}>Add</button>
              </div>
              {form.skills.length > 0 && (
                <div className="skill-tags">
                  {form.skills.map((skill) => (
                    <span key={skill} className="skill-tag">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}><X size={13} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <p className="form-group-label"><Briefcase size={16} className="inline-icon" /> Portfolio</p>
              <p className="portfolio-hint">Showcase past work — projects, designs, or apps you&apos;ve built.</p>

              {form.portfolio.length > 0 && (
                <div className="portfolio-grid">
                  {form.portfolio.map((item) => (
                    <div key={item.id} className="portfolio-item card">
                      {item.image && <img src={item.image} alt={item.title} className="portfolio-thumb" />}
                      <div className="portfolio-item-body">
                        <strong>{item.title}</strong>
                        {item.description && <p>{item.description}</p>}
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="portfolio-link">
                            <Link2 size={13} /> View
                          </a>
                        )}
                      </div>
                      <button type="button" className="portfolio-remove" onClick={() => removeWork(item.id)} aria-label="Remove">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="portfolio-add card">
                <input
                  value={work.title}
                  onChange={(e) => setWork({ ...work, title: e.target.value })}
                  placeholder="Project title"
                />
                <textarea
                  value={work.description}
                  onChange={(e) => setWork({ ...work, description: e.target.value })}
                  placeholder="Short description (optional)"
                  rows={2}
                />
                <input
                  value={work.link}
                  onChange={(e) => setWork({ ...work, link: e.target.value })}
                  placeholder="Link (optional) — https://..."
                />
                <div className="portfolio-add-actions">
                  <label className="portfolio-upload-btn">
                    <Camera size={16} /> {work.image ? 'Image added' : 'Add image'}
                    <input ref={workInputRef} type="file" accept="image/*" onChange={handleWorkImage} hidden />
                  </label>
                  <button type="button" className="btn btn-outline" onClick={addWork}>
                    <Plus size={16} /> Add to portfolio
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary">Save Profile</button>
            {saved && <p className="settings-saved">Profile updated successfully.</p>}
          </form>

          <div className="settings-danger card">
            <h2>Delete Profile</h2>
            <p>Permanently remove your account, listings, services, jobs, and messages. This cannot be undone.</p>
            {deleteError && <p className="form-error">{deleteError}</p>}
            <button
              type="button"
              className="btn btn-outline settings-delete-btn"
              onClick={handleDeleteProfile}
              disabled={deleting}
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : 'Delete Profile'}
            </button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

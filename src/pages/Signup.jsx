import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';
import {
  Lock,
  User,
  Phone,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Check,
  Camera,
  X,
  Plus,
  Sparkles,
  Briefcase,
} from 'lucide-react';
import {
  SURVEY_PURPOSES,
  SURVEY_INTERESTS,
  SURVEY_HEARD_FROM,
} from '../utils/constants';
import { validateIndianPhone } from '../utils/validation';
import './Auth.css';

const STEPS = ['Purpose', 'Interests', 'About you', 'Profile', 'Account'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const emptyWork = { title: '', description: '', image: '', link: '' };

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState('');
  const [interests, setInterests] = useState([]);
  const [passion, setPassion] = useState('');
  const [heardFrom, setHeardFrom] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [portfolio, setPortfolio] = useState([]);
  const [work, setWork] = useState(emptyWork);
  const [account, setAccount] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef(null);
  const workInputRef = useRef(null);

  const selectedPurpose = SURVEY_PURPOSES.find((p) => p.value === purpose);
  const isProvider = selectedPurpose?.group === 'provider';
  const isLastStep = step === STEPS.length - 1;

  const toggleInterest = (item) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
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
    readImage(e.target.files[0], setAvatar);
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !skills.includes(skill) && skills.length < 15) {
      setSkills([...skills, skill]);
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
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleWorkImage = (e) => {
    readImage(e.target.files[0], (dataUrl) => setWork((prev) => ({ ...prev, image: dataUrl })));
  };

  const addWork = () => {
    if (!work.title.trim()) {
      setError('Give your work a title before adding it.');
      return;
    }
    if (portfolio.length >= 12) {
      setError('You can showcase up to 12 items.');
      return;
    }
    setError('');
    setPortfolio([...portfolio, { id: crypto.randomUUID(), ...work, title: work.title.trim() }]);
    setWork(emptyWork);
    if (workInputRef.current) workInputRef.current.value = '';
  };

  const removeWork = (id) => {
    setPortfolio(portfolio.filter((p) => p.id !== id));
  };

  const validateStep = () => {
    setError('');
    if (step === 0 && !purpose) return 'Please choose why you\u2019re here.';
    if (step === 1 && interests.length === 0)
      return 'Pick at least one option so we can personalize your feed.';
    if (step === 2) {
      if (!fullName.trim()) return 'Please enter your full name.';
      if (!dob) return 'Please enter your date of birth.';
      if (!heardFrom) return 'Let us know where you heard about us.';
    }
    if (step === 3) {
      if (!phone.trim()) return 'Please enter your phone number.';
      if (!validateIndianPhone(phone)) return 'Please enter a valid Indian phone number.';
    }
    return '';
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup({
        name: fullName,
        username: account.username,
        phone,
        password: account.password,
        dob,
        survey: { purpose, interests, passion: passion.trim(), heardFrom },
        avatar,
        bio,
        skills,
        portfolio,
      });
      const dest =
        {
          'get-hired': '/jobs',
          'post-job': '/jobs',
          buy: '/discover',
          'list-content': '/discover',
          'provide-service': '/services',
        }[purpose] || '/discover';
      navigate(dest);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container">
        <motion.div
          className={`auth-card card survey-card${step === 3 ? ' survey-card-wide' : ''}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-header">
            <Logo className="auth-logo" />
            <h1>Create Account</h1>
            <p>A few quick questions so we can tailor Profinds to you</p>
          </div>

          <div className="survey-steps">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`survey-step-dot ${i === step ? 'active' : ''} ${
                  i < step ? 'done' : ''
                }`}
              >
                <span>{i < step ? <Check size={14} /> : i + 1}</span>
                <small>{label}</small>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="survey-body"
            >
              {step === 0 && (
                <div className="survey-section">
                  <h2 className="survey-q">What brings you to Profinds?</h2>
                  <div className="survey-options">
                    {SURVEY_PURPOSES.map((p) => (
                      <button
                        type="button"
                        key={p.value}
                        className={`survey-option ${purpose === p.value ? 'selected' : ''}`}
                        onClick={() => setPurpose(p.value)}
                      >
                        <span className="survey-option-label">{p.label}</span>
                        <span className="survey-option-desc">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="survey-section">
                  <h2 className="survey-q">
                    {isProvider
                      ? 'What are you passionate about?'
                      : 'What are you looking for?'}
                  </h2>
                  <p className="survey-hint">
                    {isProvider
                      ? 'Pick the areas you work in \u2014 we\u2019ll match you with the right audience.'
                      : 'Pick the types of jobs, services or content you want to see.'}
                  </p>
                  <div className="survey-chips">
                    {SURVEY_INTERESTS.map((item) => (
                      <button
                        type="button"
                        key={item}
                        className={`survey-chip ${interests.includes(item) ? 'selected' : ''}`}
                        onClick={() => toggleInterest(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  {isProvider && (
                    <div className="form-group survey-passion">
                      <label htmlFor="passion">Describe your passion (optional)</label>
                      <input
                        id="passion"
                        type="text"
                        placeholder="e.g. Building clean React dashboards"
                        value={passion}
                        onChange={(e) => setPassion(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="survey-section">
                  <h2 className="survey-q">Tell us about you</h2>
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input
                        id="fullName"
                        type="text"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="dob">Date of Birth</label>
                    <div className="input-with-icon">
                      <Calendar size={18} />
                      <input
                        id="dob"
                        type="date"
                        value={dob}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDob(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <p className="form-group-label">How did you hear about us?</p>
                    <div className="survey-chips">
                      {SURVEY_HEARD_FROM.map((h) => (
                        <button
                          type="button"
                          key={h.value}
                          className={`survey-chip ${heardFrom === h.value ? 'selected' : ''}`}
                          onClick={() => setHeardFrom(h.value)}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="survey-section signup-profile">
                  <h2 className="survey-q">Set up your profile</h2>
                  <p className="survey-hint">This is how others will see you on Profinds.</p>

                  <div className="signup-avatar-field">
                    <div className="signup-avatar-preview">
                      {avatar ? (
                        <img src={avatar} alt="Profile" />
                      ) : (
                        <span>{fullName.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <div>
                      <label htmlFor="signup-avatar-upload">Profile Picture</label>
                      <p className="signup-avatar-hint">Square image, under 2MB works best.</p>
                      <button type="button" className="btn btn-outline signup-avatar-btn" onClick={() => avatarInputRef.current?.click()}>
                        <Camera size={16} /> {avatar ? 'Change' : 'Upload'}
                      </button>
                      <input id="signup-avatar-upload" ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      placeholder="Tell buyers about your work..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone (Indian)</label>
                    <div className="input-with-icon">
                      <Phone size={18} />
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="signup-skill-input"><Sparkles size={14} className="inline-icon" /> Skills</label>
                    <div className="skill-input-row">
                      <input
                        id="signup-skill-input"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleSkillKey}
                        placeholder="e.g. React, Node.js, UI Design"
                      />
                      <button type="button" className="btn btn-outline skill-add-btn" onClick={addSkill}>Add</button>
                    </div>
                    {skills.length > 0 && (
                      <div className="skill-tags">
                        {skills.map((skill) => (
                          <span key={skill} className="skill-tag">
                            {skill}
                            <button type="button" onClick={() => removeSkill(skill)}><X size={13} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <p className="form-group-label"><Briefcase size={14} className="inline-icon" /> Portfolio <span className="optional-label">(optional)</span></p>
                    <p className="signup-avatar-hint">Showcase past work — projects, designs, or apps you&apos;ve built.</p>

                    {portfolio.length > 0 && (
                      <div className="signup-portfolio-list">
                        {portfolio.map((item) => (
                          <div key={item.id} className="signup-portfolio-item">
                            <strong>{item.title}</strong>
                            <button type="button" onClick={() => removeWork(item.id)}><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="signup-portfolio-add">
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
                      <div className="signup-portfolio-actions">
                        <label className="signup-upload-btn">
                          <Camera size={14} /> {work.image ? 'Image added' : 'Add image'}
                          <input ref={workInputRef} type="file" accept="image/*" onChange={handleWorkImage} hidden />
                        </label>
                        <button type="button" className="btn btn-outline" onClick={addWork}>
                          <Plus size={14} /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <form onSubmit={handleSubmit} className="survey-section auth-form">
                  <h2 className="survey-q">Set up your account</h2>
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input
                        id="username"
                        type="text"
                        placeholder="your_username"
                        value={account.username}
                        onChange={(e) => setAccount({ ...account, username: e.target.value })}
                        required
                        minLength={3}
                        maxLength={20}
                        pattern="[a-zA-Z0-9_]+"
                        autoComplete="username"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} />
                      <input
                        id="password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={account.password}
                        onChange={(e) => setAccount({ ...account, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  {error && <p className="form-error">{error}</p>}
                  <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                    {!loading && <ArrowRight size={18} />}
                  </button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          {!isLastStep && error && <p className="form-error">{error}</p>}

          {!isLastStep && (
            <div className="survey-nav">
              {step > 0 ? (
                <button type="button" className="btn btn-secondary" onClick={back}>
                  <ArrowLeft size={18} /> Back
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="btn btn-primary" onClick={next}>
                Continue <ArrowRight size={18} />
              </button>
            </div>
          )}

          {isLastStep && (
            <div className="survey-nav single">
              <button type="button" className="btn btn-secondary" onClick={back}>
                <ArrowLeft size={18} /> Back
              </button>
            </div>
          )}

          <p className="auth-footer">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

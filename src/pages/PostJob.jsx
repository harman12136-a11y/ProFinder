import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { addJob } from '../utils/storage';
import {
  JOB_CATEGORIES, JOB_BUDGET_TYPES, JOB_DURATIONS, JOB_EXPERIENCE_LEVELS,
} from '../utils/constants';
import { IndianRupee, Plus, X } from 'lucide-react';
import './PostJob.css';

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: JOB_CATEGORIES[0],
    description: '',
    skills: [],
    budgetType: 'fixed',
    budget: '',
    duration: JOB_DURATIONS[1],
    experienceLevel: 'intermediate',
    location: 'Remote',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !form.skills.includes(skill) && form.skills.length < 10) {
      setForm({ ...form, skills: [...form.skills, skill] });
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
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Job title is required';
    if (!form.description.trim() || form.description.trim().length < 30) e.description = 'Describe the job in at least 30 characters';
    if (!form.budget || Number(form.budget) <= 0) e.budget = 'Enter a valid budget';
    if (form.skills.length === 0) e.skills = 'Add at least one skill';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      const job = await addJob({
        posterId: user.id,
        posterName: user.name,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        skills: form.skills,
        budgetType: form.budgetType,
        budget: Number(form.budget),
        duration: form.duration,
        experienceLevel: form.experienceLevel,
        location: form.location.trim() || 'Remote',
      });
      navigate(`/job/${job.id}`);
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to post job. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="post-job-page">
      <Navbar />
      <div className="page-container post-job-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-title">Post a <span className="gradient-text">Job</span></h1>
          <p className="section-subtitle">Describe your project and receive proposals from talented professionals.</p>

          <form className="post-job-form card" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Job Title</label>
              <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Build a GST billing web app in React" />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={form.category} onChange={handleChange}>
                {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Job Description</label>
              <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={6} placeholder="Describe the scope, deliverables, tech stack, and any requirements..." />
              {errors.description && <span className="form-error">{errors.description}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="skills">Skills Required</label>
              <div className="skill-input-row">
                <input
                  id="skills"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKey}
                  placeholder="Type a skill and press Enter"
                />
                <button type="button" className="btn btn-outline skill-add-btn" onClick={addSkill}><Plus size={16} /></button>
              </div>
              {form.skills.length > 0 && (
                <div className="skill-tags">
                  {form.skills.map((skill) => (
                    <span key={skill} className="skill-tag">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
              {errors.skills && <span className="form-error">{errors.skills}</span>}
            </div>

            <div className="form-row post-job-row">
              <div className="form-group">
                <label htmlFor="budgetType">Budget Type</label>
                <select id="budgetType" name="budgetType" value={form.budgetType} onChange={handleChange}>
                  {JOB_BUDGET_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="budget">Budget {form.budgetType === 'hourly' ? '(per hour)' : '(total)'}</label>
                <div className="input-with-icon">
                  <IndianRupee size={18} />
                  <input id="budget" name="budget" type="number" min="1" value={form.budget} onChange={handleChange} placeholder="e.g. 25000" />
                </div>
                {errors.budget && <span className="form-error">{errors.budget}</span>}
              </div>
            </div>

            <div className="form-row post-job-row">
              <div className="form-group">
                <label htmlFor="duration">Project Duration</label>
                <select id="duration" name="duration" value={form.duration} onChange={handleChange}>
                  {JOB_DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="experienceLevel">Experience Level</label>
                <select id="experienceLevel" name="experienceLevel" value={form.experienceLevel} onChange={handleChange}>
                  {JOB_EXPERIENCE_LEVELS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input id="location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Remote, Bengaluru, Mumbai" />
            </div>

            {errors.submit && <span className="form-error">{errors.submit}</span>}

            <button type="submit" className="btn btn-primary post-job-submit" disabled={submitting}>
              {submitting ? 'Posting…' : 'Post Job'}
            </button>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

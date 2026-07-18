import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Code2, Users, Shield, Sparkles, ArrowRight } from 'lucide-react';
import './Landing.css';

const features = [
  {
    icon: Code2,
    title: 'Sell Your Code',
    desc: 'List your software, scripts, or code snippets and reach buyers across India.',
  },
  {
    icon: Users,
    title: 'Direct Contact',
    desc: 'Buyers connect with you directly via email or phone. No middleman, no commission on sales.',
  },
  {
    icon: Shield,
    title: 'Trusted Platform',
    desc: 'Listings with detailed descriptions, photos, and videos for every software.',
  },
  {
    icon: Sparkles,
    title: 'Simple Setup',
    desc: 'Create your listing in minutes with a straightforward publish flow.',
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <Navbar variant="transparent" />

      <section className="hero">
        <div className="page-container hero-inner">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="badge hero-badge">
              🇮🇳 Made for India
            </span>
            <h1 className="hero-title">
              Discover &amp; Sell
              <br />
              <span className="gradient-text">Software in India</span>
            </h1>
            <p className="hero-subtitle">
              Profinder is India&apos;s premier marketplace where developers list their code and software,
              and buyers discover amazing projects to power their work.
            </p>
          </motion.div>

          <motion.div
            className="hero-actions-side"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link to="/marketplace" className="btn btn-primary hero-btn">
              Explore Marketplace
              <ArrowRight size={18} />
            </Link>
            <Link to="/signup" className="btn btn-outline hero-btn">
              Start Selling
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="features-section">
        <div className="page-container">
          <motion.div
            className="features-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Why <span className="gradient-text">Profinder</span>?</h2>
            <p className="section-subtitle">
              A platform built for the Indian developer community
            </p>
          </motion.div>
          <div className="features-grid">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="feature-card card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="feature-icon">
                  <feature.icon size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="page-container">
          <h2 className="section-title">How It Works</h2>
          <div className="how-steps">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your free account with email' },
              { step: '02', title: 'List Software', desc: 'Add details, photos, and videos for your project' },
              { step: '03', title: 'Get Contacted', desc: 'Buyers browse and reach out to you directly' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="how-step"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <span className="how-step-num">{item.step}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <motion.div
          className="page-container cta-inner card"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2>Ready to sell your code?</h2>
          <p>Join developers across India on Profinder today.</p>
          <Link to="/signup" className="btn btn-primary">
            Get Started
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

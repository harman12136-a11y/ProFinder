import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './LandingPaths.css';

function getLandingPaths(user) {
  return [
    {
      id: 'jobs',
      badge: 'New',
      title: 'Hire talent or find work',
      description:
        'Post a job to hire vetted Indian professionals, or browse open projects and send proposals to get hired.',
      layout: 'row',
      actions: [
        { label: 'Post a Job', to: '/post-job', variant: 'primary' },
        { label: 'Find Jobs', to: '/jobs', variant: 'outline' },
      ],
    },
    {
      id: 'sell',
      title: 'Share your work. Someone out there needs it.',
      description: 'Publish your software and start selling today.',
      layout: 'center',
      featured: true,
      actions: [
        {
          label: 'Start selling',
          to: user ? '/list-software' : '/signup',
          variant: 'primary',
          icon: ArrowRight,
        },
      ],
    },
  ];
}

export default function LandingPaths() {
  const { user } = useAuth();
  const paths = getLandingPaths(user);

  return (
    <section className="landing-paths" aria-label="Get started on Profinds">
      <div className="page-container">
        <div className="landing-paths-grid">
          {paths.map((path, i) => (
            <motion.article
              key={path.id}
              className={[
                'landing-path',
                'card',
                `landing-path--${path.layout}`,
                path.featured && 'landing-path--featured',
              ].filter(Boolean).join(' ')}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <div className="landing-path-content">
                {path.badge && <span className="badge">{path.badge}</span>}
                <h2>{path.title}</h2>
                <p>{path.description}</p>
              </div>

              <div className="landing-path-actions">
                {path.actions.map(({ label, to, variant, icon: Icon }) => (
                  <Link
                    key={label}
                    to={to}
                    className={`btn btn-${variant === 'primary' ? 'primary' : 'outline'}`}
                  >
                    {label}
                    {Icon && <Icon size={18} />}
                  </Link>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

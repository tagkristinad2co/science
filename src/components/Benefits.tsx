import React from 'react';
import { BENEFIT_FEATURES } from '../data/content';

export const Benefits: React.FC = () => {
  return (
    <section className="section" id="benefits">
      <div className="shell">
        <div className="center">
          <div className="mini-title">Science, clearer at a glance</div>
          <h2>
            See it. Understand it.
            <br />
            Remember it.
          </h2>
          <p className="section-intro">
            An eye-catching supplement for older primary and lower-secondary
            learners, curious families, homeschoolers and independent revision.
          </p>
        </div>
        <div className="grid four">
          {BENEFIT_FEATURES.map((feat) => (
            <article key={feat.title} className="feature">
              <div className="emoji">{feat.emoji}</div>
              <h3>{feat.title}</h3>
              <p>{feat.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

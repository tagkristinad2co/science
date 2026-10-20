import React from 'react';
import { TOPIC_AREAS } from '../data/content';

export const Topics: React.FC = () => {
  return (
    <section className="section">
      <div className="shell">
        <div className="center">
          <div className="mini-title">Four areas, one collection</div>
          <h2>Explore a whole world of science.</h2>
        </div>
        <div className="grid four">
          {TOPIC_AREAS.map((topic) => (
            <div key={topic.title} className="feature">
              <div className="emoji">{topic.emoji}</div>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

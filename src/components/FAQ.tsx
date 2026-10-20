import React from 'react';
import { FAQ_ITEMS } from '../data/content';

export const FAQ: React.FC = () => {
  return (
    <section className="section" id="faq">
      <div className="shell">
        <div className="center">
          <div className="mini-title">Questions, answered</div>
          <h2>Frequently asked questions</h2>
        </div>
        <div className="faq">
          {FAQ_ITEMS.map((item, index) => (
            <details key={index}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

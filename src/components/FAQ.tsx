import React from 'react';
import { FAQItem } from '../data/content';

interface FAQProps {
  items: FAQItem[];
}

export const FAQ: React.FC<FAQProps> = ({ items }) => {
  return (
    <section className="section alt" id="faq">
      <div className="ebook-shell center">
        <h2>Frequently asked questions</h2>
        <div className="faq">
          {items.map((item, index) => (
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

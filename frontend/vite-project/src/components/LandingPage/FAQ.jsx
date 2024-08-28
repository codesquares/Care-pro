import React, { useState } from 'react';
import '../../styles/components/FAQ.scss';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const questions = [
    {
      question: 'How can I get onboarded as a caregiver?',
      answer:
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolor.',
    },
    {
      question: 'How can I get onboarded as a caregiver?',
      answer:
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolor.',
    },
    {
      question: 'How can I get onboarded as a caregiver?',
      answer:
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolor.',
    },
    // Add more questions as needed
  ];

  const toggleQuestion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq">
      <h2>Frequently Asked Questions</h2>
      <div className="faq-list">
        {questions.map((item, index) => (
          <div
            key={index}
            className={`faq-item ${activeIndex === index ? 'active' : ''}`}
            onClick={() => toggleQuestion(index)}
          >
            <div className="faq-question">
              <span>{item.question}</span>
              <div className="faq-icon">
                {activeIndex === index ? '-' : '+'}
              </div>
            </div>
            {activeIndex === index && <div className="faq-answer">{item.answer}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;

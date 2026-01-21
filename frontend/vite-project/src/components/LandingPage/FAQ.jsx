import { useState } from 'react';
import '../../styles/components/FAQ.css';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const questions = [
    {
      question: 'What types of healthcare professionals can join the platform?',
      answer:
        'Yes, you can upgrade your package! Clients can choose to upgrade their care plan at the start of every new month, ensuring a seamless transition without the need to recalculate fees. This flexible option allows you to elevate your care experience as your needs evolve.',
    },
    {
      question: 'Are there any fees to join the platform?',
      answer:
        'Yes, you can request additional services not listed in the catalog. However, this option is available exclusively to premium clients. If you need to manage other illnesses or specific care requirements, any extra services may incur additional costs. Your personal care administrator will assess these requests and provide guidance on the necessary adjustments to your care plan.',
    },
    {
      question: 'How can I reach more patients through this platform?',
      answer:
        'Clients are charged automatically at the beginning of every new month for their selected care package, unless the plan is canceled prior to renewal. If a plan is canceled after care has been accessed within a month, that month\'s subscription remains valid, and the cancellation will take effect from the following month. If care has not been accessed, a full reimbursement will be issued, minus any applicable taxes and electronic charges.',
    },
    {
      question: 'Can I connect with other healthcare professionals?',
      answer:
        'Your caregivers are vetted professionals with extensive experience in the caregiving field. They undergo thorough background checks to ensure safety and security, and each caregiver provides three guarantors with permanent addresses in the state of operation. Our caregivers are well-trained to deliver a top-notch experience that guarantees value for your investment.',
    },
    {
      question: 'How do I create a profile?',
      answer:
        'Yes, you can pause your plan. Clients have the flexibility to temporarily suspend their care package for a specified period. Please reach out to your personal care administrator to discuss the details and arrange for the pause, ensuring your care needs are managed effectively during this time.',
    },
    {
      question: 'Is my information secure on the platform?',
      answer:
        'Yes, you can switch caregivers at any time. If you feel that a different caregiver would better meet your needs, simply contact your personal care administrator to facilitate the transition. Your satisfaction and comfort are our top priorities.',
    },
    // Add more questions as needed
  ];

  const toggleQuestion = (index) => {
    // Set the active index to the currently clicked item, or null if the same item is clicked again
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
            {activeIndex === index && (
              <div className="faq-answer active">{item.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
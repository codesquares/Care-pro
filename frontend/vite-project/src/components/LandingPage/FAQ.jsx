import { useState } from 'react';
import '../../styles/components/FAQ.css';

const FAQ = ({ questions: customQuestions }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const defaultQuestions = [
    {
      question: 'What types of healthcare professionals can join the platform?',
      answer:
        'CarePro welcomes a wide range of care professionals, including adult and elderly caregivers, child care specialists, pet care providers, post-surgery recovery aides, special needs caregivers, mobility support professionals, home medical support nurses, therapy and wellness practitioners, and palliative care providers. To join, simply sign up, complete your profile, and go through our verification process.',
    },
    {
      question: 'Are there any fees to join the platform?',
      answer:
        'Signing up on CarePro is free for both clients and care professionals. For clients, a 10% platform fee applies on orders over ₦100,000, and a 20% caregiver matching fee is applied to all service bookings. These fees cover caregiver screening, quality assurance, and ongoing support. All services start from a minimum of ₦10,000 per day.',
    },
    {
      question: 'How can I reach more patients through this platform?',
      answer:
        'As a CarePro caregiver, you gain access to a broader client base by creating service gigs that are visible to all platform users. Our marketplace allows clients to search and filter by care category, so your services are easily discoverable. You can also build your reputation through client ratings and reviews, helping you attract more opportunities over time.',
    },
    {
      question: 'Can I connect with other healthcare professionals?',
      answer:
        'Yes! CarePro fosters a professional community where care providers can connect, share knowledge, and collaborate. By joining the platform, you become part of a network of verified caregivers across multiple specialties, opening doors for professional development and referral opportunities.',
    },
    {
      question: 'How do I create a profile?',
      answer:
        'Getting started is simple. Click "Become a Care Professional" and register with your details. Once signed up, complete your profile by adding your qualifications, certifications, experience, and the care categories you specialize in. Our team will then verify your credentials, and once approved, you can create service gigs and start receiving client requests.',
    },
    {
      question: 'Is my information secure on the platform?',
      answer:
        'Absolutely. CarePro takes data security seriously. All personal information is protected with industry-standard encryption and secure authentication. Your data is never shared with third parties without your consent. We also conduct thorough background checks and identity verification on all caregivers to ensure a safe and trusted environment for everyone on the platform.',
    },
    // Add more questions as needed
  ];

  const questions = customQuestions || defaultQuestions;

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
// src/pages/FAQPage.tsx
import { useState } from "react";
import "./FAQPage.css";



const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`faq-item ${open ? "open" : ""}`}>
      <div className="faq-question" onClick={() => setOpen(!open)}>
        <h3>{question}</h3>
        <span className="faq-icon">{open ? "−" : "+"}</span>
      </div>
      {open && <p className="faq-answer">{answer}</p>}
    </div>
  );
};

const FAQPage = () => {
  const faqs = [
    {
      question: "What is this platform about?",
      answer:
        "Our platform connects caregivers with clients who need professional and reliable care services.",
    },
    {
      question: "How do I become a caregiver?",
      answer:
        "Simply sign up, complete your profile, and go through our verification process before you can start offering services.",
    },
    {
      question: "How are payments handled?",
      answer:
        "Payments are processed securely through our platform to protect both caregivers and clients.",
    },
    {
      question: "Can I choose my caregiver?",
      answer:
        "Yes, clients can browse available caregivers, review profiles, and select the caregiver that best suits their needs.",
    },
  ];

  return (
    <div className="faq-page">
      <h1 className="faq-title">Frequently Asked Questions</h1>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
};

export default FAQPage;

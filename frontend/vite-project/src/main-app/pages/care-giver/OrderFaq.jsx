import{ useState } from 'react';
import '../../../styles/components/OrderFaq.css';
import NavigationBar from './care-giver-dashboard/NavigationBar';
import home from '../../../assets/home.png'

const OrderFaq = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const questions = [
    {
      question: 'What is Carepro?',
      answer:
        'Yes, you can upgrade your package! Clients can choose to upgrade their care plan at the start of every new month, ensuring a seamless transition without the need to recalculate fees. This flexible option allows you to elevate your care experience as your needs to evolve.',
    },
    {
      question: 'What types of healthcare providers are available?',
      answer:
        'tba',
    },
    {
      question: 'What payment options are available?',
      answer:
        'tba',
    },
    {
      question: 'How do I register for Carepro?',
      answer:
        'tba',
    },
    {
      question: 'Is service available across Nigeria?',
      answer:
        'tba',
    },
    {
      question: 'Is my personal information secure on this platform?',
      answer:
        'tba',
    },
  ];

  const toggleQuestion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <>
    {/* <NavigationBar /> */}

    <div className="links">
      <a href="/marketplace">
        <img src={home} alt="Home" className="home-button" />
      </a>

      <span className="separator">/</span>

      <a href="/marketplace" className="profile-link">Home</a>

      <span className="separator">/</span>

      <span className="active-page">FAQs</span>
    </div>

    <div className="faq">

      <div className="faq-container"> 
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {questions.map((item, index) => (
            <div
              key={index}
              className={`faq-item ${activeIndex === index ? "active" : ""}`}
              onClick={() => toggleQuestion(index)}
            >
              <div className="faq-question">
                <span>{item.question}</span>
                <div className="faq-icon">{activeIndex === index ? "-" : "+"}</div>
              </div>
              {activeIndex === index && <div className="faq-answer">{item.answer}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="right-bar">
          
        <div className="order-details">
          <h4>Order Details</h4>
          {/* <OrderDetails /> */}
        </div>

        <div className="resolution-center">
          <h4>Support</h4>
          {/* <SupportCenter /> */}
        </div>

      </div>

    </div>
    </>
  );
};

export default OrderFaq;
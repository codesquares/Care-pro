import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import genralImg from "../assets/nurseAndWoman.png";
import HealthcareFacts from "../components/LandingPage/HealthcareFacts";
import FAQ from "../components/LandingPage/FAQ";
import ClientHiringProcess from "../components/LandingPage/ClientHiringProcess";
import WhyCarepro from "../components/WhyCare-Pro";
import WaitlistModal from "../components/WaitListModal";
import { useAuth } from "../main-app/context/AuthContext";
import "./BecomeCaregiver.css";
const BookCaregiver = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect caregivers to their dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role?.toLowerCase() === 'caregiver') {
      navigate('/app/caregiver/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);
  
  // Handle TopBanner button click - smart navigation based on auth status
  const handleBookCaregiver = () => {
    if (isAuthenticated && user?.role?.toLowerCase() === 'client') {
      // Authenticated clients go to dashboard to browse gigs
      navigate('/app/client/dashboard');
    } else {
      // Non-authenticated users go to register
      navigate('/register');
    }
  };
  
  const clientQuestions = [
    {
      question: 'How do I book a caregiver on CarePro?',
      answer: 'Booking is simple! Browse our marketplace of verified caregivers, select the service that fits your needs (e.g., elderly care, child care), and click "Book". You can then choose your preferred caregiver and schedule your sessions.'
    },
    {
      question: 'Are all caregivers on the platform verified?',
      answer: 'Yes, every caregiver on CarePro undergoes a rigorous verification process, including identity checks, credential verification, and assessment tests to ensure the highest quality of care.'
    },
    {
      question: 'How much does it cost to hire a caregiver?',
      answer: 'Services start from ₦10,000 per day. A 10% client checkout service charge applies to all bookings. This is separate from the caregiver/platform commission split used for caregiver payouts. You can see clear pricing on each caregiver\'s service gig before you book.'
    },
    {
      question: 'Can I choose a specific caregiver?',
      answer: 'Absolutely! You can view detailed profiles, ratings, and reviews of caregivers to find the perfect match for your family\'s specific needs.'
    },
    {
      question: 'What if I need to cancel or reschedule a booking?',
      answer: 'CarePro offers a flexible system for managing your bookings. You can communicate directly with your caregiver or use the platform tools to adjust your schedule as needed, subject to our cancellation policy.'
    }
  ];

  return (
    <div className="book-caregiver">
      {/* Hero Section */}
      <section className="become-hero" style={{ backgroundImage: `url(${genralImg})` }}>
          <div className="hero-content">
              <h1>Hire a Caregiver today!</h1>
              <p>As a Carepro caregiver, you have the opportunity to make an incredible difference the minute you walk through the door, helping your clients live a happier life in their own home.</p>
              <button className="primary-btn" onClick={handleBookCaregiver}>Book a Caregiver</button>
          </div>
      </section>
      <WhyCarepro />
      <ClientHiringProcess />
      <HealthcareFacts/>
      <FAQ questions={clientQuestions} />
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
       option="bookCaregiver" />
    </div>
  );
};

export default BookCaregiver;
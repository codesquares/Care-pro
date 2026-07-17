import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../main-app/context/AuthContext";
import heroSectionImg from "../assets/become-caregiver/herosectionimg.jpg";
import connectImg from "../assets/suggested_care_image.png"; 
import manageImg from "../assets/story1.png";
import earnImg from "../assets/story2.png";
import worksLeftImg from "../assets/become-caregiver/works_left.png";
import aminaCaregiverImg from "../assets/become-caregiver/aminacaregiver.png";
import { FiUser, FiCheckCircle, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import { trackEvent } from "../main-app/services/analyticsService";
import CategoryCard from "../components/category/CategoryCard";
import { categoryBrowseData } from "../main-app/constants/categoryBrowseData";
import "./BecomeCaregiver.css";

const BecomeCaregiver = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
      if (isAuthenticated && user?.role?.toLowerCase() === 'caregiver') {
        navigate('/app/caregiver/dashboard', { replace: true });
        return;
      }
      // Track page visit (and Meta Pixel ViewContent for ad attribution)
      trackEvent('page_view', 'become_caregiver');
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq('track', 'ViewContent', { content_name: 'become_caregiver' });
      }
    }, [isAuthenticated, user, navigate]);
    
    const handleAction = () => {
      // Track CTA click before navigating
      trackEvent('cta_click', 'become_caregiver');
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq('track', 'Lead', { content_name: 'become_caregiver_cta' });
      }
      navigate('/register');
    };

        const serviceSlugs = [
            "adult-care",
            "post-surgery-care",
            "child-care",
            "pet-care",
            "home-care",
            "special-needs-care",
            "medical-support",
            "mobility-support",
            "therapy-wellness",
            "palliative",
        ];

        const services = serviceSlugs
            .map((slug) => categoryBrowseData.find((category) => category.slug === slug))
            .filter(Boolean);

    return (
        <div className="become-caregiver-page">
            {/* Hero Section */}
            <section className="become-hero" style={{ backgroundImage: `url(${heroSectionImg})` }}>
                <div className="hero-content">
                    <h1>Turn your care experience <br /><span>into </span><span className="highlight">impact & income.</span></h1>
                    <p>Connect with clients who need your expertise</p>
                    <button className="primary-btn" onClick={handleAction}>Become a Verified Caregiver</button>
                </div>
            </section>

            {/* A Smarter Way Section */}
            <section className="smarter-way">
                <div className="smarter-container">
                    <h2 className="section-title">A smarter way to work, earn & grow</h2>
                    <div className="smart-grid">
                        <div className="smart-card">
                            <img src={connectImg} alt="Connect" />
                            <div className="card-content connect-grad">
                                <h3>Connect</h3>
                                <p><strong>Expand your visibility &</strong> connect with clients who need your service on carepro</p>
                            </div>
                        </div>
                        <div className="smart-card">
                            <img src={manageImg} alt="Manage" />
                            <div className="card-content manage-grad">
                                <h3>Manage</h3>
                                <p><strong>Work on your terms.</strong> Choose who to work with, decide how you work, what you earn, & where you do it.</p>
                            </div>
                        </div>
                        <div className="smart-card">
                            <img src={earnImg} alt="Earn" />
                            <div className="card-content earn-grad">
                                <h3>Earn</h3>
                                <p><strong>Tap into a marketplace</strong> fueled by high demand of what you offer. Choose how you get paid.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How Carepro Works */}
            <section className="how-carepro-works">
                <h2 className="section-title">How Carepro Works</h2>
                <p className="section-subtitle">Build your career on carepro in 4 easy steps</p>
                
                <div className="works-content">
                    <div className="works-left">
                        <img src={worksLeftImg} alt="Caregiver with profile card" className="works-left-img" />
                    </div>
                    
                    <div className="works-right">
                        <div className="how-step">
                            <div className="how-icon user-icon"><FiUser /></div>
                            <div className="how-text">
                                <h3>Create an account on carepro</h3>
                                <p>Signing up on carepro is free. Create your profile, with an eye-catching title & client-focused overview help us match you to the work you want.</p>
                            </div>
                        </div>
                        <div className="how-step">
                            <div className="how-icon check-icon"><FiCheckCircle /></div>
                            <div className="how-text">
                                <h3>Get Verified</h3>
                                <p>Complete your ID verification. Upload necessary credentials and take you assessment test to access additional opportunities to start building trust with clients.</p>
                            </div>
                        </div>
                        <div className="how-step">
                            <div className="how-icon gig-icon"><FiBriefcase /></div>
                            <div className="how-text">
                                <h3>Create Your Gig</h3>
                                <p>Provide the information clients need to place an order. Gigs (offered services) clearly outline service benefits & expectations through high-quality descriptions & clear pricing.</p>
                            </div>
                        </div>
                        <div className="how-step">
                            <div className="how-icon pay-icon"><FiDollarSign /></div>
                            <div className="how-text">
                                <h3>Get paid securely</h3>
                                <p>After an order is completed, caregivers receive 60% of the client's cleared payment while the platform commission is 40%. This commission split is separate from any client-side checkout service charge. Get paid automatically and securely after each completed session, with no cash stress or delays.</p>
                            </div>
                        </div>
                        <button className="cta-full-btn" onClick={handleAction}>Create Account</button>
                    </div>
                </div>
            </section>

            {/* Services Professional Section */}
            <section className="prof-services">
                <div className="container">
                    <h2 className="section-title">Services you can offer as a care professional</h2>
                    <div className="prof-services-grid">
                        {services.map((service) => (
                            <CategoryCard
                                key={service.slug}
                                category={service}
                                showDescription={true}
                                showPrice={true}
                                onClick={() => navigate(`/marketplace?category=${service.slug}`)}
                            />
                        ))}
                    </div>
                    <div className="get-started-banner" onClick={handleAction}>
                        <span>Let's show the world what you've got to offer</span>
                        <span className="gs-btn">Get Started ›</span>
                    </div>
                </div>
            </section>

            {/* Opportunity Footer Section */}
            <section className="final-opp">
                <div className="opp-card">
                    <div className="opp-text">
                        <h2>Find your next opportunity</h2>
                        <p>
                            Search on the clients brief page for work you're looking for. 
                            Respond to briefs, post your gigs, set your rate, and show 
                            how great you'll be. Give a little extra by sharing your 
                            unique approach and offering when responding to a 
                            potential client.
                        </p>
                        <button className="gold-btn" onClick={handleAction}>Become a Verified Caregiver</button>
                    </div>
                    <div className="opp-img">
                        <img src={aminaCaregiverImg} alt="Amina Caregiver" />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BecomeCaregiver;